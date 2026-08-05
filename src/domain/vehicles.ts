import rawVehicleData from "../../data/vehicles.json";

import { getReserveStatus as deriveReserveStatus } from "./auction";
import type {
  BodyStyle,
  Drivetrain,
  FuelType,
  TitleStatus,
  Transmission,
  Vehicle,
  VehicleCatalog,
} from "./types";

const MILLISECONDS_PER_DAY = 86_400_000;
const LOCAL_DATE_TIME_PATTERN =
  /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2}):(\d{2})$/;
const VIN_PATTERN = /^[A-HJ-NPR-Z0-9]{17}$/;

const rawBodyStyles = ["SUV", "coupe", "hatchback", "sedan", "truck"] as const;
const rawTransmissions = [
  "CVT",
  "automatic",
  "manual",
  "single-speed",
] as const;
const rawFuelTypes = ["diesel", "electric", "gasoline", "hybrid"] as const;
const rawTitleStatuses = ["clean", "rebuilt", "salvage"] as const;
const rawDrivetrains = [
  "4WD",
  "AWD",
  "FWD",
  "RWD",
] as const satisfies readonly Drivetrain[];

const bodyStyleLabels: Record<RawVehicle["body_style"], BodyStyle> = {
  SUV: "SUV",
  coupe: "Coupe",
  hatchback: "Hatchback",
  sedan: "Sedan",
  truck: "Truck",
};

const transmissionLabels: Record<RawVehicle["transmission"], Transmission> = {
  CVT: "CVT",
  automatic: "Automatic",
  manual: "Manual",
  "single-speed": "Single-speed",
};

const fuelTypeLabels: Record<RawVehicle["fuel_type"], FuelType> = {
  diesel: "Diesel",
  electric: "Electric",
  gasoline: "Gasoline",
  hybrid: "Hybrid",
};

const titleStatusLabels: Record<RawVehicle["title_status"], TitleStatus> = {
  clean: "Clean",
  rebuilt: "Rebuilt",
  salvage: "Salvage",
};

type UnknownRecord = Record<string, unknown>;

interface RawVehicle {
  id: string;
  vin: string;
  year: number;
  make: string;
  model: string;
  trim: string;
  body_style: (typeof rawBodyStyles)[number];
  exterior_color: string;
  interior_color: string;
  engine: string;
  transmission: (typeof rawTransmissions)[number];
  drivetrain: (typeof rawDrivetrains)[number];
  odometer_km: number;
  fuel_type: (typeof rawFuelTypes)[number];
  condition_grade: number;
  condition_report: string;
  damage_notes: string[];
  title_status: (typeof rawTitleStatuses)[number];
  province: string;
  city: string;
  auction_start: string;
  starting_bid: number;
  reserve_price: number | null;
  buy_now_price: number | null;
  images: string[];
  selling_dealership: string;
  lot: string;
  current_bid: number | null;
  bid_count: number;
}

interface LocalDateTimeParts {
  year: number;
  month: number;
  day: number;
  hour: number;
  minute: number;
  second: number;
}

function invalid(path: string, expectation: string): never {
  throw new Error(`Invalid vehicle data: ${path} ${expectation}.`);
}

function readRecord(value: unknown, path: string): UnknownRecord {
  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    return invalid(path, "must be an object");
  }

  return value as UnknownRecord;
}

function readString(record: UnknownRecord, key: string, path: string) {
  const value = record[key];

  if (typeof value !== "string" || value.trim() === "") {
    return invalid(`${path}.${key}`, "must be a non-empty string");
  }

  if (value !== value.trim()) {
    return invalid(`${path}.${key}`, "must not contain outer whitespace");
  }

  return value;
}

function readNumber(
  record: UnknownRecord,
  key: string,
  path: string,
  options: { integer?: boolean; minimum?: number; maximum?: number } = {},
) {
  const value = record[key];

  if (typeof value !== "number" || !Number.isFinite(value)) {
    return invalid(`${path}.${key}`, "must be a finite number");
  }

  if (options.integer && !Number.isInteger(value)) {
    return invalid(`${path}.${key}`, "must be an integer");
  }

  if (options.minimum !== undefined && value < options.minimum) {
    return invalid(`${path}.${key}`, `must be at least ${options.minimum}`);
  }

  if (options.maximum !== undefined && value > options.maximum) {
    return invalid(`${path}.${key}`, `must be at most ${options.maximum}`);
  }

  return value;
}

function readNullablePositiveInteger(
  record: UnknownRecord,
  key: string,
  path: string,
) {
  if (record[key] === null) {
    return null;
  }

  return readNumber(record, key, path, { integer: true, minimum: 1 });
}

function readStringArray(
  record: UnknownRecord,
  key: string,
  path: string,
) {
  const value = record[key];

  if (!Array.isArray(value)) {
    return invalid(`${path}.${key}`, "must be an array");
  }

  return value.map((item, index) => {
    if (typeof item !== "string" || item.trim() === "") {
      return invalid(`${path}.${key}[${index}]`, "must be a non-empty string");
    }

    return item;
  });
}

function readImageArray(record: UnknownRecord, key: string, path: string) {
  const value = record[key];

  if (value === null) {
    return [];
  }

  if (!Array.isArray(value)) {
    return invalid(`${path}.${key}`, "must be an array or null");
  }

  return value.flatMap((item, index) => {
    if (item === null) {
      return [];
    }

    if (typeof item !== "string" || item.trim() === "") {
      return invalid(
        `${path}.${key}[${index}]`,
        "must be a non-empty string or null",
      );
    }

    return [item];
  });
}

function readEnum<const Values extends readonly string[]>(
  record: UnknownRecord,
  key: string,
  path: string,
  allowedValues: Values,
): Values[number] {
  const value = readString(record, key, path);

  if (!allowedValues.includes(value as Values[number])) {
    return invalid(
      `${path}.${key}`,
      `must be one of ${allowedValues.join(", ")}`,
    );
  }

  return value as Values[number];
}

function parseLocalDateTime(value: string, path: string): LocalDateTimeParts {
  const match = LOCAL_DATE_TIME_PATTERN.exec(value);

  if (!match) {
    return invalid(path, "must use YYYY-MM-DDTHH:mm:ss local time");
  }

  const [
    ,
    yearValue,
    monthValue,
    dayValue,
    hourValue,
    minuteValue,
    secondValue,
  ] = match;
  const parts = {
    year: Number(yearValue),
    month: Number(monthValue),
    day: Number(dayValue),
    hour: Number(hourValue),
    minute: Number(minuteValue),
    second: Number(secondValue),
  };
  const candidate = new Date(
    Date.UTC(
      parts.year,
      parts.month - 1,
      parts.day,
      parts.hour,
      parts.minute,
      parts.second,
    ),
  );

  if (
    candidate.getUTCFullYear() !== parts.year ||
    candidate.getUTCMonth() !== parts.month - 1 ||
    candidate.getUTCDate() !== parts.day ||
    candidate.getUTCHours() !== parts.hour ||
    candidate.getUTCMinutes() !== parts.minute ||
    candidate.getUTCSeconds() !== parts.second
  ) {
    return invalid(path, "must be a real local date and time");
  }

  return parts;
}

function parseRawVehicle(value: unknown, index: number): RawVehicle {
  const path = `vehicles[${index}]`;
  const record = readRecord(value, path);
  const rawVehicle: RawVehicle = {
    id: readString(record, "id", path),
    vin: readString(record, "vin", path),
    year: readNumber(record, "year", path, {
      integer: true,
      minimum: 1900,
      maximum: 2100,
    }),
    make: readString(record, "make", path),
    model: readString(record, "model", path),
    trim: readString(record, "trim", path),
    body_style: readEnum(record, "body_style", path, rawBodyStyles),
    exterior_color: readString(record, "exterior_color", path),
    interior_color: readString(record, "interior_color", path),
    engine: readString(record, "engine", path),
    transmission: readEnum(record, "transmission", path, rawTransmissions),
    drivetrain: readEnum(record, "drivetrain", path, rawDrivetrains),
    odometer_km: readNumber(record, "odometer_km", path, {
      integer: true,
      minimum: 0,
    }),
    fuel_type: readEnum(record, "fuel_type", path, rawFuelTypes),
    condition_grade: readNumber(record, "condition_grade", path, {
      minimum: 0,
      maximum: 5,
    }),
    condition_report: readString(record, "condition_report", path),
    damage_notes: readStringArray(record, "damage_notes", path),
    title_status: readEnum(record, "title_status", path, rawTitleStatuses),
    province: readString(record, "province", path),
    city: readString(record, "city", path),
    auction_start: readString(record, "auction_start", path),
    starting_bid: readNumber(record, "starting_bid", path, {
      integer: true,
      minimum: 1,
    }),
    reserve_price: readNullablePositiveInteger(record, "reserve_price", path),
    buy_now_price: readNullablePositiveInteger(record, "buy_now_price", path),
    images: readImageArray(record, "images", path),
    selling_dealership: readString(record, "selling_dealership", path),
    lot: readString(record, "lot", path),
    current_bid: readNullablePositiveInteger(record, "current_bid", path),
    bid_count: readNumber(record, "bid_count", path, {
      integer: true,
      minimum: 0,
    }),
  };

  parseLocalDateTime(rawVehicle.auction_start, `${path}.auction_start`);

  if (!VIN_PATTERN.test(rawVehicle.vin)) {
    invalid(`${path}.vin`, "must be a valid 17-character VIN");
  }

  if (rawVehicle.current_bid === null && rawVehicle.bid_count !== 0) {
    invalid(`${path}.bid_count`, "must be zero when current_bid is null");
  }

  if (
    rawVehicle.current_bid !== null &&
    (rawVehicle.bid_count === 0 ||
      rawVehicle.current_bid < rawVehicle.starting_bid)
  ) {
    invalid(
      path,
      "must pair an active bid count with a bid at or above starting_bid",
    );
  }

  return rawVehicle;
}

function assertUnique(
  vehicles: readonly RawVehicle[],
  key: "id" | "vin",
) {
  const values = new Set<string>();

  vehicles.forEach((vehicle, index) => {
    const value = vehicle[key];

    if (values.has(value)) {
      invalid(`vehicles[${index}].${key}`, `must be unique; found ${value}`);
    }

    values.add(value);
  });
}

export function normalizeAuctionSchedule(
  sourceStarts: readonly string[],
  demoDate = new Date(),
) {
  if (Number.isNaN(demoDate.getTime())) {
    throw new Error("Invalid demo date.");
  }

  if (sourceStarts.length === 0) {
    return [];
  }

  const sourceParts = sourceStarts.map((sourceStart, index) =>
    parseLocalDateTime(sourceStart, `auctionStarts[${index}]`),
  );
  const latestSourceDay = Math.max(
    ...sourceParts.map((parts) =>
      Date.UTC(parts.year, parts.month - 1, parts.day),
    ),
  );

  // This creates a timestamp for the day after demoDate
  const targetLatestDay = Date.UTC(
    demoDate.getFullYear(),
    demoDate.getMonth(),
    demoDate.getDate() + 1,
  );
  const dayShift = Math.round(
    (targetLatestDay - latestSourceDay) / MILLISECONDS_PER_DAY,
  );

  // so the auction schedule always appears current instead of containing old, expired dates.
  return sourceParts.map(
    (parts) =>
      new Date(
        parts.year,
        parts.month - 1,
        parts.day + dayShift,
        parts.hour,
        parts.minute,
        parts.second,
      ),
  );
}

export function loadVehicleCatalog(
  source: unknown,
  demoDate = new Date(),
): VehicleCatalog {
  if (!Array.isArray(source)) {
    invalid("vehicles", "must be an array");
  }

  const rawVehicles = source.map(parseRawVehicle);

  assertUnique(rawVehicles, "id");
  assertUnique(rawVehicles, "vin");

  const normalizedAuctionStarts = normalizeAuctionSchedule(
    rawVehicles.map((vehicle) => vehicle.auction_start),
    demoDate,
  );

  const reservePricesByVehicleId = new Map(
    rawVehicles.map((vehicle) => [vehicle.id, vehicle.reserve_price]),
  );
  const vehicles: Vehicle[] = rawVehicles.map((rawVehicle, index) => ({
    id: rawVehicle.id,
    vin: rawVehicle.vin,
    year: rawVehicle.year,
    make: rawVehicle.make,
    model: rawVehicle.model,
    trim: rawVehicle.trim,
    bodyStyle: bodyStyleLabels[rawVehicle.body_style],
    exteriorColor: rawVehicle.exterior_color,
    interiorColor: rawVehicle.interior_color,
    engine: rawVehicle.engine,
    transmission: transmissionLabels[rawVehicle.transmission],
    drivetrain: rawVehicle.drivetrain,
    odometerKm: rawVehicle.odometer_km,
    fuelType: fuelTypeLabels[rawVehicle.fuel_type],
    conditionGrade: rawVehicle.condition_grade,
    conditionReport: rawVehicle.condition_report,
    damageNotes: rawVehicle.damage_notes,
    titleStatus: titleStatusLabels[rawVehicle.title_status],
    province: rawVehicle.province,
    city: rawVehicle.city,
    auctionStart: normalizedAuctionStarts[index],
    startingBid: rawVehicle.starting_bid,
    images: rawVehicle.images,
    sellingDealership: rawVehicle.selling_dealership,
    lot: rawVehicle.lot,
    bid: {
      currentBid: rawVehicle.current_bid,
      bidCount: rawVehicle.bid_count,
      yourBid: null,
      reserveStatus: deriveReserveStatus(
        rawVehicle.reserve_price,
        rawVehicle.current_bid,
      ),
    },
  }));

  return {
    vehicles,
    getReserveStatus(vehicleId, currentBid) {
      if (!reservePricesByVehicleId.has(vehicleId)) {
        throw new Error(`Unknown vehicle id: ${vehicleId}.`);
      }

      return deriveReserveStatus(
        reservePricesByVehicleId.get(vehicleId) ?? null,
        currentBid,
      );
    },
  };
}

export const vehicleCatalog = loadVehicleCatalog(rawVehicleData);
export const vehicles = vehicleCatalog.vehicles;

export function getVehicleReserveStatus(
  vehicleId: string,
  currentBid: number | null,
) {
  return vehicleCatalog.getReserveStatus(vehicleId, currentBid);
}

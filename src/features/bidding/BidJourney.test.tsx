import { act, fireEvent, render, screen, within } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { Route, Router, Switch } from "wouter";
import { memoryLocation } from "wouter/memory-location";

import {
  getUserBidForVehicle,
  type ReserveStatusResolver,
} from "../../domain/bidding";
import { findVehicleById } from "../../domain/inventory";
import { makeVehicle } from "../../test/vehicleFactory";
import { InventoryRoute } from "../inventory/InventoryRoute";
import { VehicleRoute } from "../vehicle/VehicleRoute";
import { MyBidsRoute } from "./MyBidsRoute/MyBidsRoute";
import { useBidSessionState } from "./useBidSessionState";

const referenceTime = new Date(2026, 7, 4, 12);
const resolveReserveStatus = () => "Reserve met" as const;
const userId = "journey-user";

interface JourneyRoutesProps {
  initialVehicles: readonly ReturnType<typeof makeVehicle>[];
  createBidId?: () => string;
  resolveReserve?: ReserveStatusResolver;
}

function JourneyRoutes({
  initialVehicles,
  createBidId = () => "journey-bid",
  resolveReserve = resolveReserveStatus,
}: JourneyRoutesProps) {
  const { vehicles, bids, userBidEntries, placeBid } = useBidSessionState({
    userId,
    initialVehicles,
    resolveReserveStatus: resolveReserve,
    createBidId,
  });

  return (
    <Switch>
      <Route path="/">
        {() => (
          <InventoryRoute
            bids={bids}
            inventory={vehicles}
            now={referenceTime}
            userId={userId}
          />
        )}
      </Route>
      <Route path="/vehicles/:vehicleId">
        {(params) => {
          const vehicle = findVehicleById(vehicles, params.vehicleId);
          const userBid = vehicle
            ? getUserBidForVehicle(bids, vehicle.id, userId)
            : undefined;

          return vehicle ? (
            <VehicleRoute
              vehicle={vehicle}
              now={referenceTime}
              userBid={userBid}
              userId={userId}
              onPlaceBid={(amount) => placeBid(vehicle.id, amount)}
            />
          ) : null;
        }}
      </Route>
      <Route path="/bids">
        {() => <MyBidsRoute entries={userBidEntries} now={referenceTime} />}
      </Route>
    </Switch>
  );
}

describe("bid journey", () => {
  it("updates detail state and the matching inventory card in one session", () => {
    const vehicle = makeVehicle({
      auctionStart: new Date(2026, 7, 4, 11),
    });
    const { hook, navigate } = memoryLocation({
      path: `/vehicles/${vehicle.id}`,
    });

    render(
      <Router hook={hook}>
        <JourneyRoutes initialVehicles={[vehicle]} />
      </Router>,
    );

    const bidTrigger = screen.getByRole("button", { name: "Place a bid" });
    fireEvent.click(bidTrigger);
    fireEvent.change(screen.getByRole("textbox", { name: "Your bid (CAD)" }), {
      target: { value: "30,000" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Review bid" }));
    fireEvent.click(screen.getByRole("button", { name: "Place $30,000 bid" }));

    const auctionRail = screen.getByRole("complementary", {
      name: "Open for bidding",
    });
    expect(within(auctionRail).getByText("Current bid")).toBeInTheDocument();
    expect(within(auctionRail).getAllByText("$30,000").length).toBeGreaterThan(
      0,
    );
    expect(within(auctionRail).getByText("9 bids")).toBeInTheDocument();
    expect(within(auctionRail).getByText("Reserve met")).toBeInTheDocument();
    expect(within(auctionRail).getByRole("note")).toHaveTextContent(
      "You hold the current bid",
    );
    expect(
      within(auctionRail).queryByRole("button", { name: "Place a bid" }),
    ).not.toBeInTheDocument();
    const successDialog = screen.getByRole("dialog", { name: "Bid placed" });

    expect(
      within(successDialog).getByRole("heading", { name: "Bid placed" }),
    ).toHaveFocus();
    expect(within(successDialog).getByText("9")).toBeInTheDocument();
    expect(within(successDialog).getByText("Reserve met")).toBeInTheDocument();

    fireEvent.click(
      within(successDialog).getByRole("button", { name: "Done" }),
    );

    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(within(auctionRail).getByRole("note")).toHaveFocus();

    fireEvent.click(screen.getByRole("link", { name: "Back to inventory" }));

    const vehicleLink = screen.getByRole("link", {
      name: "2025 Volkswagen Tiguan Lot D-0037",
    });
    expect(
      within(vehicleLink).getByText(/You hold the current bid/),
    ).toBeInTheDocument();
    expect(
      within(vehicleLink).getByText("$30,000", { exact: false }),
    ).toBeInTheDocument();
    expect(within(vehicleLink).getByText(/9 bids/)).toBeInTheDocument();
    expect(within(vehicleLink).getByText("Reserve met")).toBeInTheDocument();

    act(() => {
      navigate("/bids");
    });

    const currentBids = screen.getByRole("list", {
      name: "Vehicles with your bids",
    });
    expect(within(currentBids).getAllByRole("listitem")).toHaveLength(1);
    expect(
      within(currentBids).getByRole("link", {
        name: "2025 Volkswagen Tiguan Lot D-0037",
      }),
    ).toHaveAttribute("href", `/vehicles/${vehicle.id}`);
    expect(
      within(currentBids).getAllByText("$30,000", { exact: false }),
    ).toHaveLength(1);
    expect(
      within(currentBids).getByText("You hold the current bid"),
    ).toBeVisible();
  });

  it("keeps a reserve-unmet raise available and locks after the reserve clears", () => {
    const vehicle = makeVehicle({
      auctionStart: new Date(2026, 7, 4, 11),
      bid: {
        currentBid: { amount: 29_500, userId: null },
        bidCount: 8,
        reserveStatus: "Reserve not met",
      },
    });
    const createBidId = vi
      .fn<() => string>()
      .mockReturnValueOnce("journey-bid-1")
      .mockReturnValueOnce("journey-bid-2");
    const resolveReserve = (_vehicleId: string, amount: number) =>
      amount >= 30_500 ? ("Reserve met" as const) : ("Reserve not met" as const);
    const { hook, navigate } = memoryLocation({
      path: `/vehicles/${vehicle.id}`,
    });

    render(
      <Router hook={hook}>
        <JourneyRoutes
          createBidId={createBidId}
          initialVehicles={[vehicle]}
          resolveReserve={resolveReserve}
        />
      </Router>,
    );

    fireEvent.click(screen.getByRole("button", { name: "Place a bid" }));
    fireEvent.change(screen.getByRole("textbox", { name: "Your bid (CAD)" }), {
      target: { value: "30,000" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Review bid" }));
    fireEvent.click(screen.getByRole("button", { name: "Place $30,000 bid" }));

    const firstSuccess = screen.getByRole("dialog", { name: "Bid placed" });
    expect(within(firstSuccess).getByText("Reserve not met")).toBeVisible();
    fireEvent.click(within(firstSuccess).getByRole("button", { name: "Done" }));

    const raiseTrigger = screen.getByRole("button", { name: "Raise your bid" });
    expect(raiseTrigger).toHaveFocus();
    expect(screen.getByRole("note")).toHaveTextContent(
      "Reserve not met — you can raise your bid",
    );

    fireEvent.click(raiseTrigger);
    const raiseDialog = screen.getByRole("dialog", { name: "Raise your bid" });
    expect(within(raiseDialog).getByText("Minimum bid:")).toHaveTextContent(
      "Minimum bid: $30,500 CAD",
    );
    fireEvent.change(
      within(raiseDialog).getByRole("textbox", { name: "Your bid (CAD)" }),
      { target: { value: "30,500" } },
    );
    fireEvent.click(within(raiseDialog).getByRole("button", { name: "Review bid" }));
    fireEvent.click(
      within(raiseDialog).getByRole("button", { name: "Place $30,500 bid" }),
    );

    const finalSuccess = screen.getByRole("dialog", { name: "Bid placed" });
    expect(within(finalSuccess).getByText("10")).toBeVisible();
    expect(within(finalSuccess).getByText("Reserve met")).toBeVisible();
    fireEvent.click(within(finalSuccess).getByRole("button", { name: "Done" }));

    const auctionRail = screen.getByRole("complementary", {
      name: "Open for bidding",
    });
    expect(within(auctionRail).getByRole("note")).toHaveFocus();
    expect(within(auctionRail).getByRole("note")).toHaveTextContent(
      "You hold the current bid",
    );
    expect(
      within(auctionRail).queryByRole("button", { name: "Raise your bid" }),
    ).not.toBeInTheDocument();

    act(() => navigate("/bids"));

    const currentBids = screen.getByRole("list", {
      name: "Vehicles with your bids",
    });
    expect(within(currentBids).getAllByRole("listitem")).toHaveLength(1);
    expect(
      within(currentBids).getByText("$30,500", { exact: false }),
    ).toBeVisible();
    expect(
      within(currentBids).queryByText("$30,000", { exact: false }),
    ).not.toBeInTheDocument();
    expect(createBidId).toHaveBeenCalledTimes(2);
  });
});

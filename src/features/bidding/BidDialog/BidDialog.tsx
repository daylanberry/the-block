import {
  useEffect,
  useRef,
  useState,
  type FormEvent,
  type KeyboardEvent as ReactKeyboardEvent,
  type MouseEvent as ReactMouseEvent,
  type SyntheticEvent,
} from "react";
import { createPortal } from "react-dom";

import { getMinimumBid, validateBidAmount } from "../../../domain/auction";
import { formatCurrency } from "../../../domain/formatters";
import type { Vehicle } from "../../../domain/types";
import "./BidDialog.css";

interface BidDialogProps {
  vehicle: Vehicle;
  onPlaceBid: (amount: number) => boolean;
}

type BidDialogStep = "entry" | "review" | "success";

export function BidDialog({ vehicle, onPlaceBid }: BidDialogProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isMobileLauncherScrolling, setIsMobileLauncherScrolling] =
    useState(false);
  const [step, setStep] = useState<BidDialogStep>("entry");
  const [rawAmount, setRawAmount] = useState("");
  const [reviewAmount, setReviewAmount] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const dialogRef = useRef<HTMLDialogElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const reviewHeadingRef = useRef<HTMLHeadingElement>(null);
  const successHeadingRef = useRef<HTMLHeadingElement>(null);
  const activeTriggerRef = useRef<HTMLButtonElement | null>(null);
  const shouldFocusEntryRef = useRef(false);
  const scrollEndTimerRef = useRef<number | null>(null);
  const dialogId = `bid-dialog-${vehicle.id}`;
  const titleId = `${dialogId}-${step}-title`;
  const contextId = `${dialogId}-context`;
  const inputId = `bid-amount-${vehicle.id}`;
  const hintId = `${inputId}-hint`;
  const errorId = `${inputId}-error`;
  const minimumBid = getMinimumBid({
    startingBid: vehicle.startingBid,
    currentBid: vehicle.bid.currentBid,
  });
  const displayedBid = vehicle.bid.currentBid ?? vehicle.startingBid;
  const vehicleName = `${vehicle.year} ${vehicle.make} ${vehicle.model}`;
  const displayedBidLabel =
    vehicle.bid.currentBid === null ? "Starting bid" : "Current bid";

  useEffect(() => {
    function handleScroll() {
      setIsMobileLauncherScrolling(true);

      if (scrollEndTimerRef.current !== null) {
        window.clearTimeout(scrollEndTimerRef.current);
      }

      scrollEndTimerRef.current = window.setTimeout(() => {
        setIsMobileLauncherScrolling(false);
        scrollEndTimerRef.current = null;
      }, 180);
    }

    window.addEventListener("scroll", handleScroll, {
      passive: true,
    });

    return () => {
      window.removeEventListener("scroll", handleScroll);

      if (scrollEndTimerRef.current !== null) {
        window.clearTimeout(scrollEndTimerRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    const dialog = dialogRef.current;

    if (!dialog) {
      return;
    }

    const previousRootOverflow = document.documentElement.style.overflow;
    document.documentElement.style.overflow = "hidden";

    if (!dialog.open) {
      dialog.showModal();
    }

    inputRef.current?.focus();

    return () => {
      document.documentElement.style.overflow = previousRootOverflow;
    };
  }, [isOpen]);

  useEffect(() => {
    if (step === "review") {
      reviewHeadingRef.current?.focus();
    } else if (step === "success") {
      successHeadingRef.current?.focus();
    } else if (shouldFocusEntryRef.current) {
      shouldFocusEntryRef.current = false;
      inputRef.current?.focus();
    }
  }, [step]);

  function resetFlow() {
    setStep("entry");
    setRawAmount("");
    setReviewAmount(null);
    setError(null);
    shouldFocusEntryRef.current = false;
  }

  function openDialog(event: ReactMouseEvent<HTMLButtonElement>) {
    activeTriggerRef.current = event.currentTarget;
    resetFlow();
    setIsOpen(true);
  }

  function requestClose() {
    dialogRef.current?.close();
  }

  function handleClose() {
    setIsOpen(false);
    resetFlow();
    activeTriggerRef.current?.focus();
  }

  function handleCancel(event: SyntheticEvent<HTMLDialogElement>) {
    event.preventDefault();
    dialogRef.current?.close();
  }

  function handleDialogClick(event: ReactMouseEvent<HTMLDialogElement>) {
    if (event.target === event.currentTarget) {
      requestClose();
    }
  }

  function handleDialogKeyDown(event: ReactKeyboardEvent<HTMLDialogElement>) {
    if (event.key !== "Escape") {
      return;
    }

    event.preventDefault();
    dialogRef.current?.close();
  }

  function validateCurrentAmount(amount: string | number) {
    return validateBidAmount(amount, {
      startingBid: vehicle.startingBid,
      currentBid: vehicle.bid.currentBid,
    });
  }

  function reviewBid(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const validation = validateCurrentAmount(rawAmount);

    if (!validation.isValid) {
      setError(validation.message);
      inputRef.current?.focus();
      return;
    }

    setError(null);
    setReviewAmount(validation.amount);
    setStep("review");
  }

  function editBid() {
    shouldFocusEntryRef.current = true;
    setStep("entry");
  }

  function confirmBid() {
    if (reviewAmount === null) {
      return;
    }

    const validation = validateCurrentAmount(reviewAmount);

    if (!validation.isValid) {
      setRawAmount(String(reviewAmount));
      setError(validation.message);
      shouldFocusEntryRef.current = true;
      setStep("entry");
      return;
    }

    const wasAccepted = onPlaceBid(validation.amount);

    if (!wasAccepted) {
      setRawAmount(String(validation.amount));
      setError(
        "Bid could not be placed. Review the latest auction details and try again.",
      );
      shouldFocusEntryRef.current = true;
      setStep("entry");
      return;
    }

    setStep("success");
  }

  const launcherContent = (
    <>
      <span>Place a bid</span>
      <strong>Minimum {formatCurrency(minimumBid)} CAD</strong>
      <i aria-hidden="true">→</i>
    </>
  );

  const modalLayer =
    typeof document === "undefined"
      ? null
      : createPortal(
          <>
            <button
              className={`bid-dialog__mobile-launcher${
                isMobileLauncherScrolling
                  ? " bid-dialog__mobile-launcher--scrolling"
                  : ""
              }`}
              type="button"
              aria-label="Place a bid"
              aria-haspopup="dialog"
              aria-controls={dialogId}
              aria-expanded={isOpen}
              onClick={openDialog}
            >
              {launcherContent}
            </button>

            <dialog
              ref={dialogRef}
              className="bid-dialog"
              id={dialogId}
              aria-labelledby={titleId}
              aria-describedby={contextId}
              onCancel={handleCancel}
              onClick={handleDialogClick}
              onClose={handleClose}
              onKeyDown={handleDialogKeyDown}
            >
              <div className="bid-dialog__masthead">
                <div>
                  <p>Buyer action / Lot {vehicle.lot}</p>
                  <strong id={contextId}>
                    {vehicleName} <span>· {vehicle.trim}</span>
                  </strong>
                </div>
                <button
                  className="bid-dialog__close"
                  type="button"
                  aria-label="Close bid dialog"
                  onClick={requestClose}
                >
                  <span>Close</span>
                  <i aria-hidden="true">×</i>
                </button>
              </div>

              {step === "entry" ? (
                <form
                  className="bid-dialog__content"
                  noValidate
                  onSubmit={reviewBid}
                >
                  <div className="bid-dialog__heading">
                    <p>Bid entry / 01</p>
                    <h2 id={titleId}>Place a bid</h2>
                  </div>

                  <dl
                    className="bid-dialog__snapshot"
                    aria-label="Auction snapshot"
                  >
                    <div>
                      <dt>{displayedBidLabel}</dt>
                      <dd>{formatCurrency(displayedBid)} CAD</dd>
                    </div>
                    <div>
                      <dt>Reserve</dt>
                      <dd>{vehicle.bid.reserveStatus}</dd>
                    </div>
                  </dl>

                  <label className="bid-dialog__label" htmlFor={inputId}>
                    Your bid <span>(CAD)</span>
                  </label>
                  <div className="bid-dialog__amount-field">
                    <span aria-hidden="true">$</span>
                    <input
                      ref={inputRef}
                      id={inputId}
                      type="text"
                      inputMode="numeric"
                      autoComplete="off"
                      spellCheck="false"
                      value={rawAmount}
                      placeholder={minimumBid.toLocaleString("en-CA")}
                      aria-invalid={error ? "true" : undefined}
                      aria-describedby={`${hintId}${error ? ` ${errorId}` : ""}`}
                      onChange={(event) => {
                        setRawAmount(event.target.value);
                        setError(null);
                      }}
                    />
                    <span>CAD</span>
                  </div>
                  <p className="bid-dialog__hint" id={hintId}>
                    Minimum bid:{" "}
                    <strong>{formatCurrency(minimumBid)} CAD</strong>
                  </p>
                  {error ? (
                    <p className="bid-dialog__error" id={errorId} role="alert">
                      <span aria-hidden="true">!</span> {error}
                    </p>
                  ) : null}

                  <div className="bid-dialog__actions">
                    <button className="bid-dialog__primary" type="submit">
                      Review bid <span aria-hidden="true">→</span>
                    </button>
                    <button
                      className="bid-dialog__secondary"
                      type="button"
                      onClick={requestClose}
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              ) : null}

              {step === "review" && reviewAmount !== null ? (
                <div className="bid-dialog__content bid-dialog__review">
                  <div className="bid-dialog__heading">
                    <p>Bid review / 02</p>
                    <h2 ref={reviewHeadingRef} id={titleId} tabIndex={-1}>
                      Review your bid
                    </h2>
                  </div>
                  <div className="bid-dialog__review-amount">
                    <span>Your bid</span>
                    <strong>{formatCurrency(reviewAmount)}</strong>
                    <small>CAD</small>
                  </div>
                  <dl className="bid-dialog__review-facts">
                    <div>
                      <dt>Vehicle</dt>
                      <dd>{vehicleName}</dd>
                    </div>
                    <div>
                      <dt>Lot</dt>
                      <dd>{vehicle.lot}</dd>
                    </div>
                    <div>
                      <dt>{displayedBidLabel}</dt>
                      <dd>{formatCurrency(displayedBid)} CAD</dd>
                    </div>
                  </dl>
                  <div className="bid-dialog__actions">
                    <button
                      className="bid-dialog__primary"
                      type="button"
                      onClick={confirmBid}
                    >
                      Place {formatCurrency(reviewAmount)} bid
                    </button>
                    <button
                      className="bid-dialog__secondary"
                      type="button"
                      onClick={editBid}
                    >
                      Edit bid
                    </button>
                  </div>
                </div>
              ) : null}

              {step === "success" && reviewAmount !== null ? (
                <div
                  className="bid-dialog__content bid-dialog__success"
                  aria-live="polite"
                >
                  <p className="bid-dialog__success-mark">
                    <span aria-hidden="true">✓</span> Bid accepted
                  </p>
                  <h2 ref={successHeadingRef} id={titleId} tabIndex={-1}>
                    Bid placed
                  </h2>
                  <p className="bid-dialog__success-copy">
                    You hold the current bid at{" "}
                    <strong>{formatCurrency(reviewAmount)} CAD</strong>.
                  </p>
                  <dl className="bid-dialog__success-facts">
                    <div>
                      <dt>Bid count</dt>
                      <dd>{vehicle.bid.bidCount}</dd>
                    </div>
                    <div>
                      <dt>Reserve</dt>
                      <dd>{vehicle.bid.reserveStatus}</dd>
                    </div>
                  </dl>
                  <button
                    className="bid-dialog__primary"
                    type="button"
                    onClick={requestClose}
                  >
                    Done
                  </button>
                </div>
              ) : null}
            </dialog>
          </>,
          document.body,
        );

  return (
    <>
      <div className="bid-dialog__rail-launcher-wrap">
        <button
          className="bid-dialog__rail-launcher"
          type="button"
          aria-label="Place a bid"
          aria-haspopup="dialog"
          aria-controls={dialogId}
          aria-expanded={isOpen}
          onClick={openDialog}
        >
          {launcherContent}
        </button>
      </div>
      {modalLayer}
    </>
  );
}

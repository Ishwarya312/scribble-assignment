import { useRef, useState } from "react";
import { useRoomStore } from "../state/roomStore";

export function GuessForm() {
  const roomStore = useRoomStore();
  const [guessText, setGuessText] = useState("");
  const [feedback, setFeedback] = useState<"correct" | "incorrect" | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const alreadyCorrect = useRef(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    const trimmed = guessText.trim();
    if (!trimmed) {
      setError("Please enter a word");
      return;
    }

    if (alreadyCorrect.current) {
      return;
    }

    setSubmitting(true);

    try {
      const response = await roomStore.submitGuess(trimmed);

      if (response.correct) {
        setFeedback("correct");
        alreadyCorrect.current = true;
        setGuessText("");
      } else {
        setFeedback("incorrect");
        setGuessText("");
      }
    } catch (caughtError) {
      setError(caughtError instanceof Error ? caughtError.message : "Failed to submit guess");
    } finally {
      setSubmitting(false);
    }
  }

  function clearFeedback() {
    setFeedback(null);
    setError(null);
  }

  if (alreadyCorrect.current) {
    return (
      <div>
        <p style={{ color: "#059669", fontWeight: 600 }}>You guessed correctly!</p>
        <p style={{ color: "#6b7280", fontSize: "0.875rem" }}>Waiting for the next round...</p>
      </div>
    );
  }

  return (
    <form className="form" onSubmit={handleSubmit}>
      <label className="form__field">
        <input
          className="form__input"
          value={guessText}
          onChange={(event) => {
            setGuessText(event.target.value);
            clearFeedback();
          }}
          placeholder="Type your guess here..."
          disabled={submitting}
        />
      </label>
      {feedback ? (
        <p style={{ color: feedback === "correct" ? "#059669" : "#dc2626", fontWeight: 600, margin: "4px 0" }}>
          {feedback === "correct" ? "Correct!" : "Incorrect, try again"}
        </p>
      ) : null}
      {error ? (
        <p style={{ color: "#dc2626", fontSize: "0.875rem", margin: "4px 0" }}>{error}</p>
      ) : null}
      <div className="button-row button-row--compact">
        <button className="button button--primary" type="submit" disabled={submitting}>
          {submitting ? "Submitting..." : "Submit Guess"}
        </button>
      </div>
    </form>
  );
}

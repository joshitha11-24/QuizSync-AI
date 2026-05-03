export async function generateQuizQuestions(topic: string, chapter: string, difficulty: string, numQuestions: number, language: string, isJEE_NEET: boolean) {
  try {
    const response = await fetch("/api/generate-quiz", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        topic,
        chapter,
        difficulty,
        numQuestions,
        language,
        isJEE_NEET,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || "Failed to generate quiz questions");
    }

    return await response.json();
  } catch (error) {
    console.error("Quiz Generation Error:", error);
    throw error;
  }
}

async function aiRouter(input) {
  try {
    return await gemini(input);
  } catch {
    try {
      return await minimax(input);
    } catch {
      return await gpt(input);
    }
  }
}

module.exports = { aiRouter };

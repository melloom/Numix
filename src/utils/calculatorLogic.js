export async function calculate(expression) {
  try {
    // Encode the expression for URL
    const encoded = encodeURIComponent(expression);
    const response = await fetch(`https://api.mathjs.org/v4/?expr=${encoded}`);
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(errorText || "API error");
    }
    const result = await response.text();
    return result;
  } catch (error) {
    return "Error";
  }
}

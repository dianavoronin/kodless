export type RouteRep = {
  name: string;
  method: string;
  endpoint: string;
  params: string[];

  description: string;
  code: string;
};

export function parseRouterFunctions(code: string) {
  const routerFunctions: RouteRep[] = [];
  const routerPattern = /(\/\/.*\n\s+)*@Router\.\w+\(["']\/.*?["']\)/g; // Match @Router decorators
  let match;

  while ((match = routerPattern.exec(code)) !== null) {
    let nonCommentIndex = match.index;
    // Skip the comments in the beginning of match
    while (code[nonCommentIndex] === "/") {
      // Find the next newline
      let newlineIndex = code.indexOf("\n", nonCommentIndex);
      while (/\s/.test(code[newlineIndex])) {
        newlineIndex++;
      }
      nonCommentIndex = newlineIndex;
    }

    const comment = code.substring(match.index, nonCommentIndex);

    // Find the index of the opening brace of the function
    const startIndex = code.indexOf("{", nonCommentIndex);
    if (startIndex === -1) continue; // If no opening brace is found, skip

    let openBraces = 1; // We start after finding the first opening brace
    let endIndex = startIndex + 1;

    // Loop through the code starting after the first opening brace
    for (; endIndex < code.length; endIndex++) {
      if (code[endIndex] === "{") {
        openBraces++;
      } else if (code[endIndex] === "}") {
        openBraces--;
        if (openBraces === 0) {
          // Once all braces are closed, break the loop
          break;
        }
      }
    }

    // If braces are balanced, extract the function
    if (openBraces === 0) {
      // Remove // from the comment, only in the beginning of the line
      const commentLines = comment.split("\n");
      const description = commentLines
        .map((line) => line.replace(/\/\/\s?/, ""))
        .join("\n")
        .trim();

      const functionStr = code.substring(nonCommentIndex, endIndex + 1);

      const name = functionStr.match(/(?<=async\s)\w+/)?.[0] || "";
      const method = functionStr.split("(")[0].split(".")[1];

      // Extract the endpoint from the @Router decorator
      const endpointOpenBracket = functionStr.indexOf("(");
      const endpointCloseBracket = functionStr.indexOf(
        ")",
        endpointOpenBracket + 1
      );
      const endpoint = functionStr.substring(
        endpointOpenBracket + 2,
        endpointCloseBracket - 1
      );

      const paramsOpenBracket = functionStr.indexOf(
        "(",
        endpointCloseBracket + 1
      );
      const paramsCloseBracket = functionStr.indexOf(
        ")",
        paramsOpenBracket + 1
      );
      const params =
        paramsCloseBracket == paramsOpenBracket + 1
          ? []
          : functionStr
              .substring(paramsOpenBracket + 1, paramsCloseBracket - 1)
              .split(",")
              .map((param) => param.trim().split(":")[0])
              .filter((param) => param !== "session");

      routerFunctions.push({
        description,
        code: functionStr,

        name,
        method,
        endpoint,
        params,
      });
    }
  }

  return routerFunctions;
}

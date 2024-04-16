type RouteRep = {
  name: string;
  method: string;
  endpoint: string;

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
      const firstBracket = functionStr.indexOf("(");
      const nextBracket = functionStr.indexOf(")", firstBracket + 1);
      const endpoint = functionStr.substring(firstBracket + 2, nextBracket - 1);

      routerFunctions.push({
        description,
        code: functionStr,

        name,
        method,
        endpoint,
      });
    }
  }

  return routerFunctions;
}

export function parseRoute(code: string) {
  const routeRegExp =
    /@Router\.(get|post)\("([^"]+)"\)\s+async\s+(\w+)\(((?:\s*\w+\s*:\s*\w+\s*,?\s*)+)\)\s*{/;
  const match = routeRegExp.exec(code);

  if (match) {
    const method = match[1];
    const endpoint = match[2];
    const functionName = match[3];
    const params = match[4]
      .split(",")
      .map((param) => {
        const paramName = param.trim().split(":")[0];
        return paramName;
      })
      .filter((param) => param !== "" && !param.startsWith("session"));

    let fieldsString = "{";
    params.forEach((param, index) => {
      fieldsString += `${param}: "input"`;
      if (index !== params.length - 1) {
        fieldsString += ", ";
      }
    });
    fieldsString += "}";

    const separatedFunctionName = functionName
      .replace(/([A-Z])/g, " $1")
      .trim();
    const capitalizedFunctionName =
      separatedFunctionName.charAt(0).toUpperCase() +
      separatedFunctionName.slice(1);

    return `\t{\n\t\tname: "${capitalizedFunctionName}",\n\t\tendpoint: "/api${endpoint}",\n\t\tmethod: "${method.toUpperCase()}",\n\t\tfields: ${fieldsString},\n\t},`;
  }
}

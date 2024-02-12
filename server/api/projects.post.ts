import { createProject } from "../manager";

export default defineEventHandler(async (event) => {
  const { name } = await readBody(event);
  await createProject(name);
  return { message: `Project ${name} created` };
});

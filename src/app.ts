import { init } from "./entry";
import identityRouter from "./app/identity";
import companyRouter from "./app/company";
import notesRouter from "./app/notes";

init([
  {
    path: "v1",
    routes: [
      ["identity", identityRouter],
      ["company", companyRouter],
      ["notes", notesRouter],
    ],
  },
]);

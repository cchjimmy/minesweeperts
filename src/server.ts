import { serveDir } from "@std/http";

export default {
  fetch(req: Request) {
    return serveDir(req);
  },
};

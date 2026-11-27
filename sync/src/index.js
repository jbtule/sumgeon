// Sumgeon's sync service Worker (sumgeon-sync): requests are checked in api.js, and each player's
// record lives in its own Durable Object (profile.js). The runtime allows only handlers and classes as
// exports here, so everything else stays in those files.
import { handle } from "./api.js";
export { Profile, Limiter, Space } from "./profile.js";
export default { fetch: handle };

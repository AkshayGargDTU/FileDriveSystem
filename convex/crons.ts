import { cronJobs } from "convex/server";
import { internal } from "./_generated/api";
const crons = cronJobs();

crons.interval(
    "delete files marked in trash",
    {minutes:1},
    internal.files.DeleteTrash
);
export default crons;
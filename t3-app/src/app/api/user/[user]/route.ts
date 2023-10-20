import { NextRequest } from "next/server";

const handler = (req: NextRequest) => {

    console.error(JSON.stringify({ message: "User Not Found", req }))
    throw new Error("Not implemented");
}

export { handler as GET, handler as POST };
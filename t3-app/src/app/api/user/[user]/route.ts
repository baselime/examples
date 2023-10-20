import { NextRequest } from "next/server";


const handler = (req: NextRequest) => {
    console.error(JSON.stringify({ message: "User Not Found", req }))
    throw Error("User Not Found");
}

export { handler as GET, handler as POST };
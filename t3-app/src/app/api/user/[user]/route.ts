import { NextRequest } from "next/server";


const handler = (req: NextRequest) => {
    console.error({ message: "User Not Found", req })
    throw Error("User Not Found");
}

export { handler as GET, handler as POST };
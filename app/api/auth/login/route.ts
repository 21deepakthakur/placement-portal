import prisma from "@/prisma/PrismaClient";
import { NextResponse } from "next/server";
import * as bcr from "bcrypt";
import * as jwt from "jsonwebtoken";
import { Company } from "@prisma/client";
interface LoginRequest {
  email: string;
  password: string;
}

function validate(body: LoginRequest): [boolean, string] {
  if (!body.email || !body.email.endsWith("gmail.com")) return [false, "email"];
  if (!body.password) return [false, "password"];
  return [true, "success"];
}

export async function POST(req: Request) {
  try {
    const body: LoginRequest = await req.json();
    //validate request body
    const validation = validate(body);
    if (!validation[0]) {
      return NextResponse.json(
        { message: `Missing/Invalid ${validation[1]}` },
        { status: 400 }
      );
    }
    //check for existing account
    const acc: Company | null| {password? : any} = await prisma.company.findFirst({
      where: { email: body.email },
    });

    if (!acc) {
      return NextResponse.json(
        { message: `An Account with ${body.email} doesn't exist` },
        { status: 404 }
      );
    }
    //compare password hash
    let match = await bcr.compare(body.password, acc.password)
    if(!match){
      return NextResponse.json({message : "Wrong Password"}, {status : 409});
    }
    let token = jwt.sign(acc, String(process.env.JWT_SECRET));
    return NextResponse.json({user: acc, token : token})
  } catch (e: any) {
    return NextResponse.json({ message: e.message }, { status: 500 });
  }
}

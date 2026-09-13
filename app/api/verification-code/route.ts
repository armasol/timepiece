import { NextResponse } from 'next/server';
export async function POST(){
  const letters='ABCDEFGHJKLMNPQRSTUVWXYZ';
  const num=Math.floor(1000+Math.random()*9000);
  const a=letters[Math.floor(Math.random()*letters.length)];
  const b=letters[Math.floor(Math.random()*letters.length)];
  return NextResponse.json({ code:`TP-${num}-${a}${b}`, expiresInMinutes:30 });
}

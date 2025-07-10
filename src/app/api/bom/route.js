/*
File: app/api/bom/route.js (Next.js App Router, Promise-style)
*/
import { NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import BOM from '@/models/BOM';

// GET /api/bom
export async function GET() {
  return connectDB()
    .then(() => BOM.find().sort('-createdAt'))
    .then(boms => NextResponse.json(boms, { status: 200 }))
    .catch(err => {
      console.error('Error fetching BOMs:', err);
      return NextResponse.json({ error: 'Failed to fetch BOMs' }, { status: 500 });
    });
}

// POST /api/bom
export async function POST(request) {
  return connectDB()
    .then(() => request.json())
    .then(body => new BOM(body).save())
    .then(savedBom => NextResponse.json(savedBom, { status: 201 }))
    .catch(err => {
      console.error('Error creating BOM:', err);
      return NextResponse.json({ error: 'Failed to create BOM' }, { status: 400 });
    });
}


export default async function handler(req, res) {
  const { query: { id }, method } = req;
  await dbConnect();
  if (method === 'GET') {
    const bom = await BOM.findById(id);
    if (!bom) return res.status(404).json({ error: 'BOM not found' });
    return res.status(200).json(bom);
  }
  res.setHeader('Allow', ['GET']);
  res.status(405).end(`Method ${method} Not Allowed`);
}



// /*
// File: app/api/bom/route.js (Next.js App Router, Promise-style)
// */
// import { NextResponse } from 'next/server';
// import connectDB from '@/lib/db';
// import BOM from '@/models/BOM';

// // GET /api/bom
// export async function GET() {
//   return connectDB()
//     .then(() => BOM.find().sort('-createdAt'))
//     .then(boms => NextResponse.json(boms, { status: 200 }))
//     .catch(err => {
//       console.error('Error fetching BOMs:', err);
//       return NextResponse.json({ error: 'Failed to fetch BOMs' }, { status: 500 });
//     });
// }

// // POST /api/bom
// export async function POST(request) {
//   return connectDB()
//     .then(() => request.json())
//     .then(body => new BOM(body).save())
//     .then(savedBom => NextResponse.json(savedBom, { status: 201 }))
//     .catch(err => {
//       console.error('Error creating BOM:', err);
//       return NextResponse.json({ error: 'Failed to create BOM' }, { status: 400 });
//     });
// }


// export default async function handler(req, res) {
//   const { query: { id }, method } = req;
//   await dbConnect();
//   if (method === 'GET') {
//     const bom = await BOM.findById(id);
//     if (!bom) return res.status(404).json({ error: 'BOM not found' });
//     return res.status(200).json(bom);
//   }
//   res.setHeader('Allow', ['GET']);
//   res.status(405).end(`Method ${method} Not Allowed`);
// }
import Customer from "@/models/CustomerModel";
import dbConnect from "@/lib/db";

export async function POST(req) {
  try {
    await dbConnect();
    const { customers } = await req.json();

    if (!customers || !Array.isArray(customers)) {
      return new Response(
        JSON.stringify({ message: "Invalid data format" }),
        { status: 400 }
      );
    }

    // Transform flat CSV data → Mongo nested schema
    const formattedCustomers = customers.map((c) => ({
      customerCode: c.customerCode,
      customerName: c.customerName,
      customerGroup: c.customerGroup,
      customerType: c.customerType,
      emailId: c.emailId,
      fromLead: c.fromLead,
      mobileNumber: c.mobileNumber,
      fromOpportunity: c.fromOpportunity,

      // ✅ wrap billing into array
      billingAddresses: [
        {
          address1: c["billingAddress.address1"] || "",
          address2: c["billingAddress.address2"] || "",
          city: c["billingAddress.city"] || "",
          state: c["billingAddress.state"] || "",
          zip: c["billingAddress.zip"] || "",
          country: c["billingAddress.country"] || "",
        },
      ],

      // ✅ wrap shipping into array
      shippingAddresses: [
        {
          address1: c["shippingAddress.address1"] || "",
          address2: c["shippingAddress.address2"] || "",
          city: c["shippingAddress.city"] || "",
          state: c["shippingAddress.state"] || "",
          zip: c["shippingAddress.zip"] || "",
          country: c["shippingAddress.country"] || "",
        },
      ],

      paymentTerms: c.paymentTerms,
      gstNumber: c.gstNumber,
      gstCategory: c.gstCategory,
      pan: c.pan,
      contactPersonName: c.contactPersonName,
      commissionRate: c.commissionRate,
      glAccount: c.glAccount,
    }));

    // Bulk insert using insertMany
    const result = await Customer.insertMany(formattedCustomers, { ordered: false });

    return new Response(
      JSON.stringify({
        message: "Customers inserted successfully",
        insertedCount: result.length,
      }),
      { status: 200 }
    );
  } catch (error) {
    console.error("Bulk upload error:", error);

    return new Response(
      JSON.stringify({ message: error.message }),
      { status: 500 }
    );
  }
}




// import Customer from "@/models/CustomerModel"; // adjust path if needed


// import dbConnect from "@/lib/db"; // <-- ensure you have a db connection helper

// export async function POST(req) {
//   try {
//     await dbConnect();
//     const { customers } = await req.json();

//     if (!customers || !Array.isArray(customers)) {
//       return new Response(
//         JSON.stringify({ message: "Invalid data format" }),
//         { status: 400 }
//       );
//     }

//     // Bulk insert using insertMany
//     const result = await Customer.insertMany(customers, { ordered: false });

//     return new Response(
//       JSON.stringify({
//         message: "Customers inserted successfully",
//         insertedCount: result.length,
//       }),
//       { status: 200 }
//     );
//   } catch (error) {
//     console.error("Bulk upload error:", error);

//     return new Response(
//       JSON.stringify({ message: error.message }),
//       { status: 500 }
//     );
//   }
// }


export async function GET() {
  // Get schema paths from Mongoose
  const schemaPaths = Customer.schema.paths;

  // Convert schema paths to CSV headers
  let headers = Object.keys(schemaPaths);

  // Remove internal mongoose fields
  headers = headers.filter(
    (field) => !["_id", "__v", "createdAt", "updatedAt"].includes(field)
  );

  // Add nested billing & shipping address fields manually (since they're arrays)
  const addressFields = ["address1", "address2", "city", "state", "zip", "country"];

  const billingHeaders = addressFields.map((f) => `billingAddress.${f}`);
  const shippingHeaders = addressFields.map((f) => `shippingAddress.${f}`);

  const finalHeaders = [...headers, ...billingHeaders, ...shippingHeaders];

  // Convert headers into CSV string
  const csv = finalHeaders.join(",") + "\n";

  return new Response(csv, {
    headers: {
      "Content-Type": "text/csv",
      "Content-Disposition": "attachment; filename=customer_template.csv",
    },
  });
}

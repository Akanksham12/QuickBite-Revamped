export function groupOrderRows(rows, { includeCustomer = false } = {}) {
  const orders = new Map();

  for (const row of rows) {
    let order = orders.get(row.orderId);
    if (!order) {
      order = {
        id: row.orderId,
        total: row.total,
        status: row.status,
        createdAt: row.createdAt,
        items: [],
      };
      if (includeCustomer) {
        order.phone = row.phone;
        order.address = row.address;
        order.customerName = row.customerName;
        order.customerEmail = row.customerEmail;
      }
      orders.set(row.orderId, order);
    }

    order.items.push({
      title: row.title,
      quantity: row.quantity,
      price: row.price,
    });
  }

  return [...orders.values()];
}

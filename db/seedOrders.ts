/**
 * The demo order, extracted from server.ts so both the in-memory driver and the
 * MongoDB seeder use one definition.
 *
 * Timestamps are relative to process start, which is fine for a seed: they are
 * written once, either into memory on boot or into an empty database.
 */
import { INITIAL_FOOD_ITEMS, INITIAL_USERS } from '../src/data/initialData';
import type { Order } from '../src/types';

const minutesAgo = (minutes: number) => new Date(Date.now() - minutes * 60000).toISOString();

export const INITIAL_ORDERS: Order[] = [
  {
    id: 'ord_1001',
    userId: 'usr_customer_1',
    userName: 'Alex Johnson',
    userEmail: 'alex@example.com',
    restaurantId: 'rest_1',
    restaurantName: 'Pizza Maestro',
    items: [
      {
        cartItemId: 'item_1',
        foodItem: INITIAL_FOOD_ITEMS[0],
        quantity: 1,
        customizations: [
          {
            groupTitle: 'Choose Crust Size',
            selectedOptions: [{ name: 'Large (12")', price: 80 }],
          },
        ],
        itemTotalPrice: 429,
      },
      {
        cartItemId: 'item_2',
        foodItem: INITIAL_FOOD_ITEMS[2],
        quantity: 1,
        itemTotalPrice: 149,
      },
    ],
    deliveryAddress: INITIAL_USERS[0].addresses[0],
    itemTotal: 578,
    deliveryFee: 40,
    taxAndPackaging: 35,
    discountAmount: 150,
    couponCode: 'CRAVE50',
    totalAmount: 503,
    status: 'Out for Delivery',
    paymentMethod: 'Credit/Debit Card',
    paymentStatus: 'Paid',
    stripePaymentIntentId: 'pi_3MtwB2LkdOwZnY2g1O214R9w',
    deliveryDriver: {
      name: 'Marcus Vance',
      phone: '+91 98765 12345',
      avatar:
        'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=200&q=80',
    },
    timeline: [
      { status: 'Placed', timestamp: minutesAgo(25), message: 'Order received by restaurant.' },
      { status: 'Confirmed', timestamp: minutesAgo(22), message: 'Restaurant accepted your order.' },
      { status: 'Preparing', timestamp: minutesAgo(15), message: 'Chef is preparing fresh ingredients.' },
      {
        status: 'Out for Delivery',
        timestamp: minutesAgo(5),
        message: 'Driver Marcus Vance is en route to your address.',
      },
    ],
    createdAt: minutesAgo(25),
    updatedAt: minutesAgo(5),
  },
];

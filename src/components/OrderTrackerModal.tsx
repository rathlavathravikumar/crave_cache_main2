import React, { useEffect } from 'react';
import {
  X,
  CheckCircle,
  Clock,
  MapPin,
  Phone,
  Utensils,
  Bike,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  RefreshCw,
} from 'lucide-react';
import { Order, OrderStatus } from '../types';
import { useAppDispatch } from '../hooks/reduxHooks';
import { cancelOrder, setActiveTrackOrderId } from '../store/slices/orderSlice';
import { confirm } from './ui';

interface OrderTrackerModalProps {
  order: Order;
  onClose: () => void;
}

export const OrderTrackerModal: React.FC<OrderTrackerModalProps> = ({ order, onClose }) => {
  const dispatch = useAppDispatch();

  const stages: { status: OrderStatus; label: string; icon: any }[] = [
    { status: 'Placed', label: 'Order Placed', icon: Clock },
    { status: 'Confirmed', label: 'Accepted by Kitchen', icon: CheckCircle },
    { status: 'Preparing', label: 'Food Cooking', icon: Utensils },
    { status: 'Out for Delivery', label: 'On The Way', icon: Bike },
    { status: 'Delivered', label: 'Delivered', icon: CheckCircle2 },
  ];

  const getStageIndex = (status: OrderStatus) => {
    switch (status) {
      case 'Placed':
        return 0;
      case 'Confirmed':
        return 1;
      case 'Preparing':
        return 2;
      case 'Out for Delivery':
        return 3;
      case 'Delivered':
        return 4;
      default:
        return -1;
    }
  };

  const currentStageIdx = getStageIndex(order.status);
  const isCancelled = order.status === 'Cancelled';

  const handleCancelOrder = async () => {
    const ok = await confirm({
      title: 'Cancel this order?',
      description: 'The restaurant will be notified and any payment will be refunded.',
      confirmLabel: 'Cancel order',
      cancelLabel: 'Keep order',
      tone: 'warning',
    });
    if (ok) {
      dispatch(cancelOrder(order.id));
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fadeIn">
      <div className="relative w-full max-w-xl bg-white rounded-panel shadow-2xl overflow-hidden border border-surface-line flex flex-col max-h-[90vh] animate-popIn">
        
        {/* Header */}
        <div className="p-5 bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 text-white flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[13px] font-bold uppercase tracking-wider text-amber-400">
                Order #{order.id}
              </span>
              <span className="px-2 py-0.5 rounded-full text-[12px] font-semibold uppercase bg-brand-500/20 text-brand-200 border border-brand-500/30">
                {order.status}
              </span>
            </div>
            <h3 className="text-lg font-bold mt-0.5">{order.restaurantName}</h3>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-full text-ink-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tracker Progress Bar */}
        <div className="p-6 bg-surface-sunken border-b border-surface-line">
          {isCancelled ? (
            <div className="p-4 bg-red-50 text-red-700 rounded-card border border-red-200 flex items-center gap-3">
              <XCircle className="w-8 h-8 text-red-500 shrink-0" />
              <div>
                <h4 className="font-bold text-sm">Order Cancelled</h4>
                <p className="text-[13px] text-red-600">Your refund has been initiated to your original payment method.</p>
              </div>
            </div>
          ) : (
            <div>
              <div className="flex items-center justify-between mb-4 relative z-10">
                {stages.map((st, i) => {
                  const Icon = st.icon;
                  const isCompleted = i <= currentStageIdx;
                  const isCurrent = i === currentStageIdx;

                  return (
                    <div key={st.status} className="flex flex-col items-center flex-1 text-center">
                      <div
                        className={`w-9 h-9 rounded-full flex items-center justify-center font-bold text-[13px] transition-all ${
                          isCompleted
                            ? 'bg-brand-500 text-white shadow-md shadow-brand-500/20'
                            : 'bg-slate-200 text-ink-400'
                        } ${isCurrent ? 'ring-4 ring-brand-500/20 scale-110' : ''}`}
                      >
                        <Icon className="w-4 h-4" />
                      </div>
                      <span className={`text-[12px] font-bold mt-1.5 line-clamp-1 ${isCompleted ? 'text-ink-900' : 'text-ink-400'}`}>
                        {st.label}
                      </span>
                    </div>
                  );
                })}
              </div>

              {/* Connecting Bar */}
              <div className="relative w-full bg-slate-200 h-1.5 rounded-full overflow-hidden -mt-10 mb-6">
                <div
                  className="bg-brand-500 h-full transition-all duration-500"
                  style={{
                    width: `${Math.min(100, (currentStageIdx / (stages.length - 1)) * 100)}%`,
                  }}
                />
              </div>

              <div className="text-center pt-2">
                <p className="text-[13px] font-semibold text-ink-600">
                  Estimated Delivery Time: <strong className="text-ink-900">20-25 Mins</strong>
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Order Details & Driver Card */}
        <div className="p-6 flex-1 overflow-y-auto space-y-5">
          
          {/* Driver details if on the way */}
          {order.deliveryDriver && !isCancelled && currentStageIdx >= 3 && (
            <div className="p-4 bg-brand-50/80 rounded-card border border-brand-100 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <img
                  src={order.deliveryDriver.avatar}
                  alt={order.deliveryDriver.name}
                  className="w-12 h-12 rounded-full object-cover ring-2 ring-brand-500"
                />
                <div>
                  <span className="text-[12px] font-semibold uppercase text-brand-600 tracking-wider">Your Delivery Hero</span>
                  <h4 className="font-bold text-ink-900 text-sm">{order.deliveryDriver.name}</h4>
                </div>
              </div>

              <a
                href={`tel:${order.deliveryDriver.phone}`}
                className="py-2 px-3 bg-slate-900 text-white rounded-control text-[13px] font-bold flex items-center gap-1.5 hover:bg-slate-800 transition-colors shadow-sm"
              >
                <Phone className="w-3.5 h-3.5 text-brand-300" />
                <span>Call Driver</span>
              </a>
            </div>
          )}

          {/* Timeline Events */}
          <div>
            <h4 className="text-[13px] font-bold text-ink-400 uppercase tracking-wider mb-3">Live Order Timeline</h4>
            <div className="space-y-3 pl-2 border-l-2 border-brand-100">
              {order.timeline.map((item, idx) => (
                <div key={idx} className="relative pl-4 text-[13px]">
                  <div className="absolute -left-[13px] top-0.5 w-3 h-3 rounded-full bg-brand-500 ring-4 ring-white" />
                  <span className="font-bold text-ink-900 block">{item.status}</span>
                  <span className="text-ink-500 text-[13px] block">{item.message}</span>
                  <span className="text-[12px] text-ink-400">{new Date(item.timestamp).toLocaleTimeString()}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Itemized Order List */}
          <div>
            <h4 className="text-[13px] font-bold text-ink-400 uppercase tracking-wider mb-2">Ordered Items</h4>
            <div className="space-y-2 bg-surface-sunken p-3 rounded-card border border-surface-line/80">
              {order.items.map((item, idx) => (
                <div key={idx} className="flex justify-between items-center text-[13px]">
                  <div>
                    <span className="font-bold text-ink-900">{item.foodItem.name}</span>
                    <span className="text-ink-500 ml-2">x{item.quantity}</span>
                  </div>
                  <span className="font-bold text-ink-900">₹{item.itemTotalPrice * item.quantity}</span>
                </div>
              ))}

              <div className="pt-2 border-t border-surface-line flex justify-between font-bold text-ink-900 text-[13px]">
                <span>Total Amount Paid</span>
                <span className="text-brand-600">₹{order.totalAmount}</span>
              </div>
            </div>
          </div>

        </div>

        {/* Footer Actions */}
        <div className="p-4 bg-surface-sunken border-t border-surface-line flex justify-between items-center gap-3">
          <div className="text-[13px] text-ink-500">
            Payment Method: <strong className="text-ink-900">{order.paymentMethod}</strong>
          </div>

          {!isCancelled && order.status !== 'Delivered' && (
            <button
              onClick={handleCancelOrder}
              className="py-2 px-4 text-[13px] font-bold text-red-600 hover:bg-red-50 rounded-control transition-colors border border-red-200"
            >
              Cancel Order
            </button>
          )}
        </div>

      </div>
    </div>
  );
};

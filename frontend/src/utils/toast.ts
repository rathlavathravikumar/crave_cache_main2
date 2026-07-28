import { toast, ToastOptions } from 'react-toastify';

const defaultOptions: ToastOptions = {
  position: 'top-right',
  autoClose: 3500,
  hideProgressBar: false,
  closeOnClick: true,
  pauseOnHover: true,
  draggable: true,
  progress: undefined,
  theme: 'colored',
};

export const showToast = {
  success: (message: string) => {
    toast.success(message, defaultOptions);
  },
  error: (message: string) => {
    toast.error(message, defaultOptions);
  },
  warning: (message: string) => {
    toast.warning(message, defaultOptions);
  },
  info: (message: string) => {
    toast.info(message, defaultOptions);
  },
  promise: async <T>(
    promise: Promise<T>,
    msgs: { pending: string; success: string; error: string }
  ) => {
    return toast.promise(
      promise,
      {
        pending: msgs.pending,
        success: msgs.success,
        error: {
          render({ data }: { data?: any }) {
            return (data as Error)?.message || msgs.error;
          },
        },
      },
      defaultOptions
    );
  },
};

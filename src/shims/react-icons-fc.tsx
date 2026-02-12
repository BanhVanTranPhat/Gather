type IconProps = {
  className?: string;
  size?: number | string;
};

// Simple shim for FcGoogle that renders nothing to avoid React/JSX issues
export function FcGoogle(_props: IconProps) {
  return null;
}


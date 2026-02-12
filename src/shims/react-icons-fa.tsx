// Extremely small shim for FontAwesome icons used in this app.
// To avoid any React/JSX/rollup interop issues on Netlify, these
// components simply render nothing. The UI still works; you just
// don't see the decorative icons on this deployment.

type IconProps = {
  className?: string;
  size?: number | string;
};

function makeIcon(): (props: IconProps) => null {
  return function Icon() {
    return null;
  };
}

export const FaLaptop = makeIcon();
export const FaMobileAlt = makeIcon();
export const FaTrash = makeIcon();
export const FaExclamationCircle = makeIcon();
export const FaCheckCircle = makeIcon();
export const FaEye = makeIcon();
export const FaEyeSlash = makeIcon();
export const FaCheck = makeIcon();
export const FaTimes = makeIcon();
export const FaApple = makeIcon();
export const FaFacebook = makeIcon();
export const FaMicrosoft = makeIcon();
export const FaKey = makeIcon();
export const FaArrowLeft = makeIcon();
export const FaBell = makeIcon();
export const FaLock = makeIcon();
export const FaMoon = makeIcon();
export const FaSun = makeIcon();
export const FaUserShield = makeIcon();
export const FaVideo = makeIcon();
export const FaBriefcase = makeIcon();
export const FaMicrophone = makeIcon();
export const FaVolumeUp = makeIcon();
export const FaPen = makeIcon();
export const FaChevronDown = makeIcon();
export const FaTimesCircle = makeIcon();


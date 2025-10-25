import type { SVGProps } from "react";

export type IconProps = SVGProps<SVGSVGElement> & {
  title?: string;
};

const getAccessibilityProps = (title?: string) =>
  title
    ? {
        role: "img" as const,
        "aria-hidden": undefined,
      }
    : {
        role: undefined,
        "aria-hidden": true,
      };

export const SparkIcon = ({ title = "Estrela brilhante", ...props }: IconProps) => (
  <svg
    {...getAccessibilityProps(title)}
    viewBox="0 0 48 48"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    {...props}
  >
    {title ? <title>{title}</title> : null}
    <path
      d="M24 4.5 28.8 16l11.7 4-11.7 4L24 35.5 19.2 24l-11.7-4 11.7-4L24 4.5Z"
      fill="url(#spark-gradient)"
    />
    <path
      d="M24 10.8 27 18l7.2 2.5L27 23.1 24 30.3 21 23l-7.2-2.5L21 18l3-7.2Z"
      fill="rgba(255, 255, 255, 0.85)"
    />
    <defs>
      <linearGradient
        id="spark-gradient"
        x1="12"
        y1="4.5"
        x2="36"
        y2="35.5"
        gradientUnits="userSpaceOnUse"
      >
        <stop stopColor="#ffb6eb" />
        <stop offset="1" stopColor="#3773f6" />
      </linearGradient>
    </defs>
  </svg>
);

export const RocketIcon = ({ title = "Foguete", ...props }: IconProps) => (
  <svg
    {...getAccessibilityProps(title)}
    viewBox="0 0 48 48"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    {...props}
  >
    {title ? <title>{title}</title> : null}
    <path
      d="M24 4c5.9 0 10.7 4.8 10.7 10.7V28c0 3.8-2 7.4-5.3 9.4l-5.4 3.3-5.4-3.3c-3.3-2-5.3-5.6-5.3-9.4V14.7C13.3 8.8 18.1 4 24 4Z"
      fill="url(#rocket-body)"
    />
    <circle cx="24" cy="17" r="4.2" fill="#fff" opacity="0.95" />
    <path
      d="M16.2 27.6c-3.7.9-6.6 4.1-7.2 8l-.7 4.4 4.3-.9c4-.8 7.3-3.6 8.3-7.2l-4.7-4.3Z"
      fill="url(#rocket-fire)"
    />
    <path
      d="M31.8 27.6c3.7.9 6.6 4.1 7.2 8l.7 4.4-4.3-.9c-4-.8-7.3-3.6-8.3-7.2l4.7-4.3Z"
      fill="url(#rocket-fire)"
    />
    <defs>
      <linearGradient
        id="rocket-body"
        x1="24"
        y1="4"
        x2="24"
        y2="40.7"
        gradientUnits="userSpaceOnUse"
      >
        <stop stopColor="#63cdff" />
        <stop offset="1" stopColor="#3773f6" />
      </linearGradient>
      <linearGradient
        id="rocket-fire"
        x1="12.5"
        y1="26.5"
        x2="18.8"
        y2="39.5"
        gradientUnits="userSpaceOnUse"
      >
        <stop stopColor="#ffde89" />
        <stop offset="1" stopColor="#ff8d1f" />
      </linearGradient>
    </defs>
  </svg>
);

export const PuzzleIcon = ({ title = "Quebra-cabeça", ...props }: IconProps) => (
  <svg
    {...getAccessibilityProps(title)}
    viewBox="0 0 48 48"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    {...props}
  >
    {title ? <title>{title}</title> : null}
    <path
      d="M18 7.5c0-2.8 2.2-5 5-5s5 2.2 5 5c0 1.4-.6 2.7-1.5 3.6H36A4.5 4.5 0 0 1 40.5 15v8.5c-2-.8-4.4.2-5.2 2.3-.9 2.3.3 4.9 2.7 5.6-1 .7-2.2 1.1-3.5 1.1h-4.5v4.4c0 3.4-2.8 6.2-6.2 6.2s-6.2-2.8-6.2-6.2c0-.6.1-1.2.2-1.7H12A4.5 4.5 0 0 1 7.5 30V15A7.5 7.5 0 0 1 15 7.5h3c0-2.8 2.2-5 5-5Z"
      fill="url(#piece-base)"
    />
    <path
      d="M18.8 22.5c2.4-1.6 5.7-.1 6.1 2.7.3 2-.9 3.9-2.7 4.7-1.5.6-2.6 2-2.6 3.6 0 .7.2 1.3.5 1.9h-4.1c-2.5 0-4.5-2-4.5-4.4v-5.3c2.3.5 4.6-.3 6.3-1.8Z"
      fill="#ffe4c3"
      opacity="0.75"
    />
    <defs>
      <linearGradient
        id="piece-base"
        x1="24"
        y1="2.5"
        x2="24"
        y2="40"
        gradientUnits="userSpaceOnUse"
      >
        <stop stopColor="#ffb6eb" />
        <stop offset="1" stopColor="#ffa648" />
      </linearGradient>
    </defs>
  </svg>
);

export const StarIcon = ({ title = "Estrela", ...props }: IconProps) => (
  <svg
    {...getAccessibilityProps(title)}
    viewBox="0 0 40 40"
    fill="currentColor"
    xmlns="http://www.w3.org/2000/svg"
    {...props}
  >
    {title ? <title>{title}</title> : null}
    <path d="m20 3 4.6 9.4 10.4 1.5-7.5 7.3 1.8 10.3L20 27.9l-9.3 5.6L12.5 21 5 13.9l10.4-1.5L20 3Z" />
  </svg>
);

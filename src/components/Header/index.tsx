import Link from 'next/link';

export default function Header(): JSX.Element {
  return (
    <div>
      <Link href="/">
        <a>
          <img src="/images/Logo.svg" alt="logo" />
        </a>
      </Link>
    </div>
  );
}

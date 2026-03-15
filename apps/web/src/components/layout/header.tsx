import Link from "next/link";

export function Header() {
  return (
    <header role="banner" className="border-b border-gray-200 bg-white">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3">
        <Link
          href="/pt"
          className="text-primary text-xl font-bold"
          aria-label="Eat Out Adviser - Página inicial"
        >
          Eat Out Adviser
        </Link>
        <nav aria-label="Navegação principal">
          <ul className="flex items-center gap-6">
            <li>
              <Link
                href="/pt"
                className="hover:text-primary focus-visible:ring-primary inline-flex min-h-[var(--spacing-touch-target)] min-w-[var(--spacing-touch-target)] items-center text-gray-700 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
              >
                Início
              </Link>
            </li>
            <li>
              <Link
                href="/pt/restaurantes"
                className="hover:text-primary focus-visible:ring-primary inline-flex min-h-[var(--spacing-touch-target)] min-w-[var(--spacing-touch-target)] items-center text-gray-700 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
              >
                Restaurantes
              </Link>
            </li>
            <li>
              <Link
                href="/pt/sobre"
                className="hover:text-primary focus-visible:ring-primary inline-flex min-h-[var(--spacing-touch-target)] min-w-[var(--spacing-touch-target)] items-center text-gray-700 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
              >
                Sobre
              </Link>
            </li>
          </ul>
        </nav>
      </div>
    </header>
  );
}

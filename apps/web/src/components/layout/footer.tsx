export function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer role="contentinfo" className="border-t border-gray-200 bg-gray-50">
      <div className="mx-auto max-w-7xl px-4 py-8">
        <div className="flex flex-col items-center justify-between gap-4 sm:flex-row">
          <p className="text-sm text-gray-600">
            &copy; {currentYear} Eat Out Adviser. Todos os direitos reservados.
          </p>
          <p className="text-sm text-gray-500">
            Plataforma de acessibilidade para restaurantes em Portugal.
          </p>
        </div>
      </div>
    </footer>
  );
}

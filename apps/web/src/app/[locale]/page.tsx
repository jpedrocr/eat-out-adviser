export default function HomePage() {
  return (
    <div className="mx-auto max-w-4xl px-4 py-12">
      <section aria-labelledby="hero-heading" className="text-center">
        <h1
          id="hero-heading"
          className="text-4xl font-bold tracking-tight text-gray-900 sm:text-5xl"
        >
          Eat Out Adviser
        </h1>
        <p className="mt-4 text-lg text-gray-600">
          Descubra restaurantes acessíveis para todos. Recomendações personalizadas com base na
          acessibilidade física do espaço.
        </p>
      </section>

      <section aria-labelledby="search-heading" className="mt-12">
        <h2 id="search-heading" className="sr-only">
          Pesquisar restaurantes
        </h2>
        <form
          role="search"
          aria-label="Pesquisar restaurantes acessíveis"
          className="mx-auto max-w-xl"
        >
          <div className="relative">
            <label htmlFor="search-input" className="sr-only">
              Pesquisar restaurantes acessíveis
            </label>
            <input
              id="search-input"
              type="search"
              name="query"
              placeholder="Pesquisar restaurantes acessíveis..."
              autoComplete="off"
              className="focus:border-primary focus:ring-primary w-full rounded-lg border border-gray-300 px-4 py-3 text-lg shadow-sm transition-colors placeholder:text-gray-400 focus:outline-none focus:ring-2"
            />
          </div>
        </form>
      </section>

      <section aria-labelledby="about-heading" className="mt-16">
        <h2 id="about-heading" className="text-2xl font-semibold text-gray-900">
          Sobre a plataforma
        </h2>
        <div className="mt-6 grid gap-8 sm:grid-cols-3">
          <div className="rounded-lg border border-gray-200 p-6">
            <h3 className="text-primary text-lg font-medium">Acessibilidade verificada</h3>
            <p className="mt-2 text-gray-600">
              Cada restaurante é avaliado com base em critérios reais de acessibilidade física,
              incluindo entrada, interior e casa de banho.
            </p>
          </div>
          <div className="rounded-lg border border-gray-200 p-6">
            <h3 className="text-secondary text-lg font-medium">Recomendações personalizadas</h3>
            <p className="mt-2 text-gray-600">
              As sugestões são adaptadas ao seu perfil de mobilidade, garantindo que cada
              recomendação é relevante para si.
            </p>
          </div>
          <div className="rounded-lg border border-gray-200 p-6">
            <h3 className="text-primary-dark text-lg font-medium">Comunidade colaborativa</h3>
            <p className="mt-2 text-gray-600">
              Contribua com avaliações e ajude outros utilizadores a encontrar espaços
              verdadeiramente acessíveis.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}

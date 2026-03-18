import PublicMenu from "@/components/PublicMenu";

interface HomePageProps {
  searchParams: Promise<{ page?: string }>;
}

export default async function Home({ searchParams }: HomePageProps) {
  const params = await searchParams;
  const parsedPage = Number(params.page);
  const initialPage = Number.isFinite(parsedPage)
    ? Math.max(0, parsedPage - 1)
    : 0;

  return <PublicMenu initialPage={initialPage} />;
  }

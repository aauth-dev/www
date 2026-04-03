import { Layout, Navbar } from 'nextra-theme-docs'
import { getPageMap } from 'nextra/page-map'

export default async function NextraLayout({ children }) {
  return (
    <Layout
        pageMap={await getPageMap()}
        navbar={
          <Navbar
            logo={<span className="font-bold text-xl">AAuth</span>}
          />
        }
        docsRepositoryBase="https://github.com/hellocoop/aauth.ai/tree/main/"
        sidebar={{
          defaultMenuCollapseLevel: 1,
          autoCollapse: true,
        }}
        toc={{
          backToTop: "Scroll to top",
        }}
        editLink="Edit this page on GitHub"
        feedback={{
          content: "Question? Give us feedback",
        }}
      >
        {children}
      </Layout>
  )
}

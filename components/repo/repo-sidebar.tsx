"use client";

import Link from "next/link";
import { useUser } from "@/contexts/user-context";
import { useRepo } from "@/contexts/repo-context";
import { useConfig } from "@/contexts/config-context";
import { User } from "@/components/user";
import { RepoDropdown } from "@/components/repo/repo-dropdown";
import { RepoNav } from "@/components/repo/repo-nav";
import { About } from "@/components/about";
import { ArrowLeft } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";

const RepoSidebar = ({
  onClick
}: {
  onClick?: () => void
}) => {
  const { user } = useUser();
  const repo = useRepo();
  const { config } = useConfig();

  const account = user?.accounts?.find((account) => account.login === repo.owner);

  return (
    <>
      <header className="border-b flex items-center px-3 py-2">
        <Link className={buttonVariants({ variant: "ghost", size: "xs" })} href="/" prefetch={true}>
          <ArrowLeft className="h-4 w-4 mr-1.5" />
          All projects
        </Link>
      </header>
      <div className="px-3 pt-1">
        <RepoDropdown onClick={onClick} />
      </div>
	  {config?.object?.build_hook && (
		<button id="publishChangesBtn" data-build-hook={config.object.build_hook} onClick={(e) => (window as any).oodelalliPublishChanges(e.currentTarget)}>Publish</button>
	  )}
      <nav className="px-3 flex flex-col gap-y-1 overflow-auto">
        <RepoNav onClick={onClick}/>
      </nav>
      <footer className="flex items-center gap-x-2 border-t px-3 py-2 mt-auto">
        <User className="mr-auto" onClick={onClick}/>
        <About onClick={onClick}/>
      </footer>
		{config?.object?.custom_css_url && (
			<link rel="stylesheet" href={config.object.custom_css_url} />
		)}
    </>
  );
}

export { RepoSidebar };
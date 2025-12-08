import Link from "next/link";

export const Navbar = () => {
	return (
		<nav className="flex items-center justify-between px-6 sm:px-10 py-4 border-b border-gray-700 bg-black sticky top-0 z-50">
			<div>
				<h1 className="text-2xl font-serif text-gray-100 tracking-wide">
					SHERLOCK HOLMES
				</h1>
				<p className="text-xs text-gray-400 uppercase tracking-widest mt-1">
					Blockchain Forensics Division
				</p>
			</div>
		</nav>
	);
};

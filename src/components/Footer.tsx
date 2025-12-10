import { Facebook, Instagram, Youtube } from "lucide-react";

const Footer = () => {
  const contactInfo = [
    { label: "isaacmuaco582@gmail.com", href: "mailto:isaacmuaco582@gmail.com" },
    { label: "+244 947 541 761", href: "tel:+244947541761" },
    { label: "+244 943 443 400", href: "tel:+244943443400" },
  ];

  const socialLinks = [
    { 
      label: "Facebook", 
      href: "https://www.facebook.com/isaac.muaco582",
      icon: Facebook
    },
    { 
      label: "Instagram", 
      href: "https://m.instagram.com/isaaccunhapinto_official",
      icon: Instagram
    },
    { 
      label: "TikTok", 
      href: "https://tiktok.com/@isaacmuaco582",
      icon: () => (
        <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
          <path d="M19.59 6.69a4.83 4.83 0 01-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 01-5.2 1.74 2.89 2.89 0 012.31-4.64 2.93 2.93 0 01.88.13V9.4a6.84 6.84 0 00-1-.05A6.33 6.33 0 005 20.1a6.34 6.34 0 0010.86-4.43v-7a8.16 8.16 0 004.77 1.52v-3.4a4.85 4.85 0 01-1-.1z"/>
        </svg>
      )
    },
    { 
      label: "YouTube", 
      href: "https://www.youtube.com/@Isaac_Muaco",
      icon: Youtube
    },
  ];

  return (
    <footer className="bg-zinc-950 text-white pb-16">
      <div className="px-5 md:px-20 py-12 md:py-16">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 md:gap-x-12 lg:gap-x-16 items-start">
          {/* Logo Section */}
          <div className="md:col-span-1">
            <div className="text-2xl font-bold">
              Isaac Muaco
            </div>
            <p className="text-sm mt-2 text-zinc-400">Vlog</p>
          </div>

          {/* Contactos */}
          <div className="md:col-span-1">
            <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-400 mb-4">CONTACTOS</h3>
            <nav className="flex flex-col gap-2">
              {contactInfo.map((info) => (
                <a key={info.label} href={info.href} className="text-sm text-zinc-300 hover:text-white transition-colors">
                  {info.label}
                </a>
              ))}
            </nav>
          </div>

          {/* Redes Sociais */}
          <div className="md:col-span-1">
            <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-400 mb-4">REDES SOCIAIS</h3>
            <nav className="flex flex-wrap gap-3">
              {socialLinks.map((link) => {
                const IconComponent = link.icon;
                return (
                  <a
                    key={link.label}
                    href={link.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 p-3 rounded-full bg-zinc-800 hover:bg-red-600 transition-colors"
                    title={link.label}
                  >
                    <IconComponent className="w-5 h-5" />
                  </a>
                );
              })}
            </nav>
          </div>
        </div>

        {/* Copyright */}
        <div className="mt-12 pt-6 border-t border-zinc-800">
          <p className="text-sm text-center md:text-left text-zinc-500">
            © 2025 ISAAC MUACO. TODOS OS DIREITOS RESERVADOS.
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;

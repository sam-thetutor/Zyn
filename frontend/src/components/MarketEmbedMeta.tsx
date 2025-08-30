import React from 'react';
import { Helmet } from 'react-helmet';

interface MarketEmbedMetaProps {
  market: {
    id: string;
    question: string;
    description: string;
    category: string;
    totalPool: bigint;
  };
}

export const MarketEmbedMeta: React.FC<MarketEmbedMetaProps> = ({ market }) => {
  const embedData = {
    version: "1",
    imageUrl: "https://zynp.vercel.app/logo.png",
    button: {
      title: "🏆 View Market",
      action: {
        type: "launch_miniapp",
        name: "Zyn Protocol",
        url: `https://zynp.vercel.app/market/${market.id}`,
        splashImageUrl: "https://zynp.vercel.app/logo.png",
        splashBackgroundColor: "#1a1a1a"
      }
    }
  };

  return (
    <Helmet>
      <meta name="fc:miniapp" content={JSON.stringify(embedData)} />
      <meta name="fc:frame" content={JSON.stringify(embedData)} />
      <meta property="og:title" content={`${market.question} - Zyn Protocol`} />
      <meta property="og:description" content={market.description} />
      <meta property="og:image" content="https://zynp.vercel.app/logo.png" />
      <meta property="og:type" content="website" />
      <meta property="og:url" content={`https://zynp.vercel.app/market/${market.id}`} />
    </Helmet>
  );
};

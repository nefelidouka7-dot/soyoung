import { PrismaClient, type Prisma } from "@prisma/client";
import bcrypt from "bcryptjs";
import { resolveDatabaseUrl } from "../db/env";

resolveDatabaseUrl();

const prisma = new PrismaClient();

const HERO = "/images/hero.jpg";
const BRAND_IMG = "/images/product-cream.jpg";
const CAT = {
  makeup: "/images/category-makeup.jpg",
  skincare: "/images/category-skincare.jpg",
  haircare: "/images/category-haircare.jpg",
  body: "/images/category-body.jpg",
} as const;

function productImage(p: {
  name: string;
  productType: string;
  tags: string[];
}): string {
  const key = `${p.productType} ${p.name} ${p.tags.join(" ")}`.toLowerCase();
  if (key.includes("spf") || key.includes("sun")) return "/images/product-spf.jpg";
  if (key.includes("lip")) return "/images/product-lip.jpg";
  if (
    key.includes("blush") ||
    key.includes("pencil") ||
    key.includes("tint")
  ) {
    return "/images/product-blush.jpg";
  }
  if (
    key.includes("hair") ||
    key.includes("shampoo") ||
    key.includes("conditioner")
  ) {
    return "/images/product-hair.jpg";
  }
  if (
    key.includes("mist") ||
    key.includes("spray") ||
    key.includes("micellar")
  ) {
    return "/images/product-mist.jpg";
  }
  if (key.includes("huile") || key.includes("oil") || key.includes("prodigieuse")) {
    return "/images/product-oil.jpg";
  }
  if (
    key.includes("sheet") ||
    key.includes("mask") ||
    key.includes("clay") ||
    key.includes("balm")
  ) {
    return "/images/product-mask.jpg";
  }
  if (
    key.includes("cleanse") ||
    key.includes("gel") ||
    key.includes("foam")
  ) {
    return "/images/product-cleanser.jpg";
  }
  if (
    key.includes("serum") ||
    key.includes("retinol") ||
    key.includes("niacinamide") ||
    key.includes("vitamin")
  ) {
    return "/images/product-serum.jpg";
  }
  return "/images/product-cream.jpg";
}

async function main() {
  console.log("Seeding SoYoung…");

  await prisma.orderTimeline.deleteMany();
  await prisma.orderItem.deleteMany();
  await prisma.payment.deleteMany();
  await prisma.shipment.deleteMany();
  await prisma.order.deleteMany();
  await prisma.review.deleteMany();
  await prisma.cartItem.deleteMany();
  await prisma.cart.deleteMany();
  await prisma.wishlistItem.deleteMany();
  await prisma.wishlist.deleteMany();
  await prisma.productSkinType.deleteMany();
  await prisma.productConcern.deleteMany();
  await prisma.productImage.deleteMany();
  await prisma.productVariant.deleteMany();
  await prisma.inventoryLedger.deleteMany();
  await prisma.product.deleteMany();
  await prisma.coupon.deleteMany();
  await prisma.address.deleteMany();
  await prisma.session.deleteMany();
  await prisma.account.deleteMany();
  await prisma.passwordResetToken.deleteMany();
  await prisma.user.deleteMany();
  await prisma.skinType.deleteMany();
  await prisma.concern.deleteMany();
  await prisma.category.deleteMany();
  await prisma.brand.deleteMany();
  await prisma.siteSetting.deleteMany();
  await prisma.popularSearch.deleteMany();

  const adminHash = await bcrypt.hash("Admin123!", 12);
  const customerHash = await bcrypt.hash("Customer123!", 12);

  const admin = await prisma.user.create({
    data: {
      email: "admin@soyoung.com",
      passwordHash: adminHash,
      name: "SoYoung Admin",
      firstName: "SoYoung",
      lastName: "Admin",
      role: "ADMIN",
    },
  });

  const customer = await prisma.user.create({
    data: {
      email: "customer@soyoung.com",
      passwordHash: customerHash,
      name: "Elena Papadopoulos",
      firstName: "Elena",
      lastName: "Papadopoulos",
      role: "CUSTOMER",
      wishlist: { create: {} },
      cart: { create: {} },
      addresses: {
        create: {
          firstName: "Elena",
          lastName: "Papadopoulos",
          line1: "12 Kolonaki Square",
          city: "Athens",
          postalCode: "10673",
          country: "GR",
          phone: "+30 210 000 0000",
          isDefault: true,
        },
      },
    },
  });

  const skinTypes = await Promise.all(
    [
      {
        name: "Oily",
        nameEl: "Λιπαρή",
        slug: "oily",
        description: "Skin that tends to produce excess oil and may appear shiny.",
        sortOrder: 1,
      },
      {
        name: "Dry",
        nameEl: "Ξηρή",
        slug: "dry",
        description: "Skin that often feels tight, rough or lacking moisture.",
        sortOrder: 2,
      },
      {
        name: "Combination",
        nameEl: "Μικτή",
        slug: "combination",
        description: "Oilier in some areas and drier in others.",
        sortOrder: 3,
      },
      {
        name: "Normal",
        nameEl: "Κανονική",
        slug: "normal",
        description: "Generally balanced skin with minimal dryness or oiliness.",
        sortOrder: 4,
      },
      {
        name: "Sensitive",
        nameEl: "Ευαίσθητη",
        slug: "sensitive",
        description: "Skin that is more prone to redness, irritation or discomfort.",
        sortOrder: 5,
      },
    ].map((s) => prisma.skinType.create({ data: s }))
  );

  const concernDefs = [
    ["Hydration", "hydration"],
    ["Blemishes", "blemishes"],
    ["Anti-aging", "anti-aging"],
    ["Brightening", "brightening"],
    ["Redness", "redness"],
    ["Oil control", "oil-control"],
    ["Skin barrier", "skin-barrier"],
    ["Sun protection", "sun-protection"],
  ] as const;

  const concerns = await Promise.all(
    concernDefs.map(([name, slug]) =>
      prisma.concern.create({ data: { name, slug } })
    )
  );

  const brandDefs = [
    ["CeraVe", "cerave", "Developed with dermatologists. Essential ceramides for barrier care.", true],
    ["Avène", "avene", "Thermal spring water skincare for sensitive skin.", true],
    ["La Roche-Posay", "la-roche-posay", "Dermatological skincare recommended by professionals.", true],
    ["The Ordinary", "the-ordinary", "Clinical formulations with integrity.", true],
    ["Nuxe", "nuxe", "Natural-origin French beauty rituals.", true],
    ["Caudalie", "caudalie", "Vinotherapy skincare powered by grape polyphenols.", true],
    ["Bioderma", "bioderma", "Biology at the service of dermatology.", false],
    ["Clarins", "clarins", "Plant-rich Parisian beauty since 1954.", true],
  ] as const;

  const brands = await Promise.all(
    brandDefs.map(([name, slug, description, featured]) =>
      prisma.brand.create({
        data: {
          name,
          slug,
          description,
          featured,
          logo: BRAND_IMG,
          banner: HERO,
          website: `https://www.${slug.replace(/-/g, "")}.com`,
          seoTitle: `${name} at SoYoung`,
          seoDescription: description,
        },
      })
    )
  );

  const brand = (slug: string) => brands.find((b) => b.slug === slug)!;

  const makeup = await prisma.category.create({
    data: {
      name: "Makeup",
      slug: "makeup",
      description: "Thoughtful colour for everyday radiance.",
      image: CAT.makeup,
    },
  });
  const skincare = await prisma.category.create({
    data: {
      name: "Skincare",
      slug: "skincare",
      description: "Rituals for calm, resilient skin.",
      image: CAT.skincare,
      seoTitle: "Skincare",
    },
  });
  const haircare = await prisma.category.create({
    data: {
      name: "Haircare",
      slug: "haircare",
      description: "Nourishing care for healthy hair.",
      image: CAT.haircare,
    },
  });
  const body = await prisma.category.create({
    data: {
      name: "Body",
      slug: "body",
      description: "Body care essentials.",
      image: CAT.body,
    },
  });

  const [cleansers, serums, moisturizers, masks] = await Promise.all(
    [
      ["Cleansers", "cleansers", CAT.skincare],
      ["Serums", "serums", CAT.skincare],
      ["Moisturizers", "moisturizers", CAT.skincare],
      ["Masks", "masks", CAT.skincare],
    ].map(([name, slug, image], i) =>
      prisma.category.create({
        data: {
          name,
          slug,
          parentId: skincare.id,
          sortOrder: i,
          image,
        },
      })
    )
  );

  type PDef = {
    name: string;
    slug: string;
    brand: string;
    categoryId: string;
    price: number;
    compareAt?: number;
    stock: number;
    productType: string;
    volume: string;
    short: string;
    description: string;
    ingredients: string;
    howToUse: string;
    tags: string[];
    skin: string[];
    concerns: string[];
    bestSeller?: boolean;
    featured?: boolean;
    variants?: Array<{ name: string; type: "SHADE" | "SIZE" | "VOLUME"; price?: number; stock: number }>;
  };

  const products: PDef[] = [
    {
      name: "Hydrating Face Serum",
      slug: "hydrating-face-serum",
      brand: "the-ordinary",
      categoryId: serums.id,
      price: 28.9,
      stock: 45,
      productType: "Serum",
      volume: "30ml",
      short: "A lightweight hyaluronic serum for plump, comfortable skin.",
      description: "Multi-weight hyaluronic acid helps skin feel hydrated and smooth throughout the day.",
      ingredients: "Aqua, Sodium Hyaluronate, Pentylene Glycol, Propanediol, Sodium Lactate.",
      howToUse: "Apply a few drops to clean skin morning and evening before moisturiser.",
      tags: ["serum", "hydration", "hyaluronic"],
      skin: ["dry", "normal", "combination", "sensitive"],
      concerns: ["hydration", "skin-barrier"],
      bestSeller: true,
      featured: true,
    },
    {
      name: "Gentle Cleansing Gel",
      slug: "gentle-cleansing-gel",
      brand: "avene",
      categoryId: cleansers.id,
      price: 16.5,
      stock: 60,
      productType: "Cleanser",
      volume: "200ml",
      short: "A soft gel cleanser that removes impurities without stripping.",
      description: "Formulated with Avène thermal spring water for comfort on reactive skin.",
      ingredients: "Avène Thermal Spring Water, Glycerin, Coco-Betaine.",
      howToUse: "Massage onto damp face, rinse thoroughly. Use morning and evening.",
      tags: ["cleanser", "gentle"],
      skin: ["sensitive", "dry", "normal"],
      concerns: ["redness", "skin-barrier"],
      bestSeller: true,
    },
    {
      name: "Vitamin C Serum",
      slug: "vitamin-c-serum",
      brand: "the-ordinary",
      categoryId: serums.id,
      price: 24.0,
      compareAt: 29.0,
      stock: 38,
      productType: "Serum",
      volume: "30ml",
      short: "A brightening vitamin C treatment for a more even-looking complexion.",
      description: "Ascorbyl glucoside delivers antioxidant support with a light texture.",
      ingredients: "Aqua, Ascorbyl Glucoside, Propanediol, Sodium Citrate.",
      howToUse: "Apply in the morning after cleansing. Follow with SPF.",
      tags: ["serum", "vitamin-c", "brightening"],
      skin: ["normal", "combination", "oily"],
      concerns: ["brightening", "anti-aging"],
      bestSeller: true,
      featured: true,
    },
    {
      name: "Daily Moisturizer",
      slug: "daily-moisturizer",
      brand: "cerave",
      categoryId: moisturizers.id,
      price: 18.9,
      stock: 80,
      productType: "Moisturizer",
      volume: "52ml",
      short: "Ceramide-rich daily cream for lasting comfort.",
      description: "With three essential ceramides and hyaluronic acid to support the skin barrier.",
      ingredients: "Aqua, Glycerin, Caprylic/Capric Triglyceride, Ceramide NP, Ceramide AP.",
      howToUse: "Apply to face morning and night as needed.",
      tags: ["moisturizer", "ceramides"],
      skin: ["dry", "normal", "sensitive", "combination"],
      concerns: ["hydration", "skin-barrier"],
      bestSeller: true,
    },
    {
      name: "SPF 50 Face Cream",
      slug: "spf-50-face-cream",
      brand: "la-roche-posay",
      categoryId: moisturizers.id,
      price: 22.5,
      stock: 55,
      productType: "SPF",
      volume: "50ml",
      short: "High-protection daily sunscreen with a refined finish.",
      description: "Broad-spectrum SPF 50 designed for everyday wear under makeup.",
      ingredients: "Aqua, Homosalate, Ethylhexyl Salicylate, Glycerin.",
      howToUse: "Apply generously as the last step of your morning routine. Reapply as needed.",
      tags: ["spf", "sun"],
      skin: ["normal", "combination", "oily", "sensitive"],
      concerns: ["sun-protection"],
      bestSeller: true,
      featured: true,
    },
    {
      name: "Lip Oil",
      slug: "lip-oil",
      brand: "clarins",
      categoryId: makeup.id,
      price: 27.0,
      stock: 40,
      productType: "Lip",
      volume: "7ml",
      short: "Nourishing lip oil with a soft tinted sheen.",
      description: "Plant oils condition lips while delivering a sheer wash of colour.",
      ingredients: "Ricinus Communis Seed Oil, Caprylic/Capric Triglyceride, Tocopherol.",
      howToUse: "Apply directly to lips as needed throughout the day.",
      tags: ["lip", "makeup"],
      skin: ["normal", "dry", "sensitive"],
      concerns: ["hydration"],
      bestSeller: true,
      variants: [
        { name: "Rosewood", type: "SHADE", stock: 15 },
        { name: "Honey", type: "SHADE", stock: 12 },
        { name: "Berry", type: "SHADE", stock: 13 },
      ],
    },
    {
      name: "Cream Blush",
      slug: "cream-blush",
      brand: "nuxe",
      categoryId: makeup.id,
      price: 26.0,
      compareAt: 32.0,
      stock: 35,
      productType: "Blush",
      volume: "5g",
      short: "A blendable cream blush for a natural flush.",
      description: "Soft, buildable colour that melts into skin.",
      ingredients: "Caprylic/Capric Triglyceride, Mica, CI 77491, Tocopherol.",
      howToUse: "Tap onto the apples of cheeks and blend with fingers or brush.",
      tags: ["blush", "makeup"],
      skin: ["normal", "dry", "combination"],
      concerns: ["brightening"],
      featured: true,
      variants: [
        { name: "Peach", type: "SHADE", stock: 12 },
        { name: "Rose", type: "SHADE", stock: 14 },
      ],
    },
    {
      name: "Hair Repair Mask",
      slug: "hair-repair-mask",
      brand: "nuxe",
      categoryId: haircare.id,
      price: 29.5,
      stock: 28,
      productType: "Hair Mask",
      volume: "200ml",
      short: "An intensive mask for softer, more manageable hair.",
      description: "Rich cream texture to nourish dry or stressed lengths.",
      ingredients: "Aqua, Cetearyl Alcohol, Behentrimonium Chloride, Argan Oil.",
      howToUse: "Apply to clean, towel-dried hair. Leave 5–10 minutes. Rinse.",
      tags: ["hair", "mask"],
      skin: ["normal"],
      concerns: ["hydration"],
      bestSeller: true,
    },
    {
      name: "Cleansing Balm",
      slug: "cleansing-balm",
      brand: "clarins",
      categoryId: cleansers.id,
      price: 34.0,
      stock: 42,
      productType: "Cleanser",
      volume: "125ml",
      short: "A melting balm that dissolves makeup and impurities.",
      description: "Transforms to a silky oil on contact, rinsing clean without residue.",
      ingredients: "Ethylhexyl Palmitate, Peg-20 Glyceryl Triisostearate, Caprylic/Capric Triglyceride.",
      howToUse: "Massage onto dry skin, emulsify with water, rinse. Follow with cleanser if desired.",
      tags: ["cleanser", "balm"],
      skin: ["dry", "normal", "combination", "sensitive"],
      concerns: ["skin-barrier"],
      featured: true,
    },
    {
      name: "Barrier Repair Cream",
      slug: "barrier-repair-cream",
      brand: "la-roche-posay",
      categoryId: moisturizers.id,
      price: 21.9,
      stock: 50,
      productType: "Moisturizer",
      volume: "40ml",
      short: "Comforting cream for compromised or reactive skin.",
      description: "Supports the barrier with soothing textures and minimal fragrance.",
      ingredients: "Aqua, Glycerin, Shea Butter, Niacinamide, Panthenol.",
      howToUse: "Apply morning and evening to clean skin.",
      tags: ["moisturizer", "barrier"],
      skin: ["sensitive", "dry", "normal"],
      concerns: ["skin-barrier", "redness", "hydration"],
      bestSeller: true,
    },
    {
      name: "Foaming Facial Cleanser",
      slug: "foaming-facial-cleanser",
      brand: "cerave",
      categoryId: cleansers.id,
      price: 14.5,
      stock: 70,
      productType: "Cleanser",
      volume: "236ml",
      short: "Gel-to-foam cleanser for normal to oily skin.",
      description: "Removes excess oil while helping maintain the skin barrier.",
      ingredients: "Aqua, Cocamidopropyl Hydroxysultaine, Glycerin, Ceramide NP.",
      howToUse: "Massage onto wet skin, rinse well.",
      tags: ["cleanser", "foaming"],
      skin: ["oily", "combination", "normal"],
      concerns: ["oil-control", "blemishes"],
      bestSeller: true,
    },
    {
      name: "Niacinamide 10% Serum",
      slug: "niacinamide-10-serum",
      brand: "the-ordinary",
      categoryId: serums.id,
      price: 12.9,
      stock: 90,
      productType: "Serum",
      volume: "30ml",
      short: "High-strength niacinamide for refined-looking texture.",
      description: "Helps reduce the appearance of blemishes and uneven tone.",
      ingredients: "Aqua, Niacinamide, Pentylene Glycol, Zinc PCA.",
      howToUse: "Apply a few drops after cleansing, before heavier creams.",
      tags: ["serum", "niacinamide"],
      skin: ["oily", "combination", "normal"],
      concerns: ["blemishes", "oil-control", "brightening"],
      bestSeller: true,
    },
    {
      name: "Thermal Spring Mist",
      slug: "thermal-spring-mist",
      brand: "avene",
      categoryId: skincare.id,
      price: 11.5,
      stock: 65,
      productType: "Mist",
      volume: "150ml",
      short: "Soothing thermal water mist for instant comfort.",
      description: "Spray throughout the day to calm and refresh the skin.",
      ingredients: "Avène Thermal Spring Water, Nitrogen.",
      howToUse: "Spray onto face, leave on or blot gently.",
      tags: ["mist", "soothing"],
      skin: ["sensitive", "dry", "normal", "combination"],
      concerns: ["redness", "skin-barrier"],
    },
    {
      name: "Resveratrol Night Serum",
      slug: "resveratrol-night-serum",
      brand: "caudalie",
      categoryId: serums.id,
      price: 48.0,
      stock: 22,
      productType: "Serum",
      volume: "30ml",
      short: "Overnight antioxidant serum for smoother-looking skin.",
      description: "Grape-derived resveratrol supports overnight renewal.",
      ingredients: "Aqua, Resveratrol, Hyaluronic Acid, Glycerin.",
      howToUse: "Apply in the evening after cleansing.",
      tags: ["serum", "night", "antioxidant"],
      skin: ["normal", "dry", "combination"],
      concerns: ["anti-aging", "brightening"],
      featured: true,
    },
    {
      name: "Polyphenol C15 Cream",
      slug: "polyphenol-c15-cream",
      brand: "caudalie",
      categoryId: moisturizers.id,
      price: 42.0,
      compareAt: 49.0,
      stock: 18,
      productType: "Moisturizer",
      volume: "50ml",
      short: "Antioxidant cream with vitamin C derivatives.",
      description: "Daily cream to support radiance and comfort.",
      ingredients: "Aqua, Grape Seed Polyphenols, Ascorbyl Tetraisopalmitate.",
      howToUse: "Apply morning and/or evening.",
      tags: ["moisturizer", "antioxidant"],
      skin: ["normal", "dry", "combination"],
      concerns: ["anti-aging", "brightening"],
    },
    {
      name: "Micellar Water",
      slug: "micellar-water",
      brand: "bioderma",
      categoryId: cleansers.id,
      price: 13.9,
      stock: 100,
      productType: "Cleanser",
      volume: "500ml",
      short: "The classic micellar cleanser for face and eyes.",
      description: "Removes makeup and impurities with no rinse required.",
      ingredients: "Aqua, Peg-6 Caprylic/Capric Glycerides, Cucumis Sativus Fruit Extract.",
      howToUse: "Apply with a cotton pad morning and evening.",
      tags: ["cleanser", "micellar"],
      skin: ["sensitive", "normal", "combination", "dry"],
      concerns: ["skin-barrier"],
      bestSeller: true,
    },
    {
      name: "Sensibio Eye Contour",
      slug: "sensibio-eye-contour",
      brand: "bioderma",
      categoryId: moisturizers.id,
      price: 19.9,
      stock: 33,
      productType: "Eye Care",
      volume: "15ml",
      short: "Gentle eye cream for delicate contours.",
      description: "Lightweight texture suitable for sensitive eye areas.",
      ingredients: "Aqua, Glycerin, Caprylic/Capric Triglyceride, Ginkgo Biloba.",
      howToUse: "Pat gently around the eye contour morning and evening.",
      tags: ["eye", "sensitive"],
      skin: ["sensitive", "dry", "normal"],
      concerns: ["redness", "hydration"],
    },
    {
      name: "Huile Prodigieuse",
      slug: "huile-prodigieuse",
      brand: "nuxe",
      categoryId: body.id,
      price: 32.0,
      stock: 40,
      productType: "Oil",
      volume: "50ml",
      short: "Iconic multi-purpose dry oil for face, body and hair.",
      description: "Silky dry oil with a signature scent and luminous finish.",
      ingredients: "Coco-Caprylate/Caprate, Macadamia Oil, Borage Oil, Tocopherol.",
      howToUse: "Apply a few drops to damp or dry skin and hair ends.",
      tags: ["oil", "body", "hair"],
      skin: ["dry", "normal"],
      concerns: ["hydration"],
      bestSeller: true,
      featured: true,
      variants: [
        { name: "50ml", type: "VOLUME", price: 32, stock: 20 },
        { name: "100ml", type: "VOLUME", price: 49, stock: 20 },
      ],
    },
    {
      name: "Effaclar Duo+",
      slug: "effaclar-duo",
      brand: "la-roche-posay",
      categoryId: moisturizers.id,
      price: 17.9,
      stock: 48,
      productType: "Treatment",
      volume: "40ml",
      short: "Corrective care for blemish-prone skin.",
      description: "Helps reduce the appearance of imperfections and residual marks.",
      ingredients: "Aqua, Niacinamide, Salicylic Acid, Piroctone Olamine.",
      howToUse: "Apply to affected areas after cleansing.",
      tags: ["blemish", "treatment"],
      skin: ["oily", "combination"],
      concerns: ["blemishes", "oil-control"],
      bestSeller: true,
    },
    {
      name: "Cicaplast Baume B5",
      slug: "cicaplast-baume-b5",
      brand: "la-roche-posay",
      categoryId: moisturizers.id,
      price: 12.5,
      stock: 75,
      productType: "Balm",
      volume: "40ml",
      short: "Repairing balm for dry, irritated areas.",
      description: "Multi-purpose soothing balm for face and body.",
      ingredients: "Aqua, Hydrogenated Polyisobutene, Dimethicone, Panthenol, Madecassoside.",
      howToUse: "Apply to clean skin as needed.",
      tags: ["balm", "repair"],
      skin: ["sensitive", "dry"],
      concerns: ["skin-barrier", "redness"],
      bestSeller: true,
    },
    {
      name: "Retinol 0.5% in Squalane",
      slug: "retinol-05-squalane",
      brand: "the-ordinary",
      categoryId: serums.id,
      price: 11.5,
      stock: 55,
      productType: "Serum",
      volume: "30ml",
      short: "Moderate-strength retinol in a squalane base.",
      description: "Supports the look of firmer, smoother skin over time. Always use SPF by day.",
      ingredients: "Squalane, Caprylic/Capric Triglyceride, Retinol.",
      howToUse: "Apply a pea-sized amount in the evening. Start slowly. Avoid eye area.",
      tags: ["retinol", "serum"],
      skin: ["normal", "combination", "oily"],
      concerns: ["anti-aging"],
    },
    {
      name: "Clay Purifying Mask",
      slug: "clay-purifying-mask",
      brand: "caudalie",
      categoryId: masks.id,
      price: 24.5,
      stock: 30,
      productType: "Mask",
      volume: "75ml",
      short: "A clarifying clay mask for congested skin.",
      description: "Helps absorb excess oil and refine the look of pores.",
      ingredients: "Kaolin, Bentonite, Grape Water, Glycerin.",
      howToUse: "Apply a thin layer, leave 10 minutes, rinse. Use 1–2× weekly.",
      tags: ["mask", "clay"],
      skin: ["oily", "combination"],
      concerns: ["oil-control", "blemishes"],
    },
    {
      name: "Hydrating Sheet Mask",
      slug: "hydrating-sheet-mask",
      brand: "avene",
      categoryId: masks.id,
      price: 6.5,
      stock: 120,
      productType: "Mask",
      volume: "1 pc",
      short: "Single-use mask for an instant hydration boost.",
      description: "Soaked in soothing essence for dehydrated skin.",
      ingredients: "Avène Thermal Spring Water, Glycerin, Sodium Hyaluronate.",
      howToUse: "Apply to clean face for 15 minutes. Pat remaining essence in.",
      tags: ["mask", "sheet"],
      skin: ["dry", "normal", "sensitive"],
      concerns: ["hydration"],
    },
    {
      name: "Body Hydrating Lotion",
      slug: "body-hydrating-lotion",
      brand: "cerave",
      categoryId: body.id,
      price: 15.9,
      stock: 60,
      productType: "Body Lotion",
      volume: "473ml",
      short: "Ceramide body lotion for soft, comfortable skin.",
      description: "Lightweight lotion that absorbs quickly.",
      ingredients: "Aqua, Glycerin, Ceramide NP, Hyaluronic Acid.",
      howToUse: "Apply to body after bathing.",
      tags: ["body", "lotion"],
      skin: ["dry", "normal", "sensitive"],
      concerns: ["hydration", "skin-barrier"],
    },
    {
      name: "Smoothing Shampoo",
      slug: "smoothing-shampoo",
      brand: "clarins",
      categoryId: haircare.id,
      price: 22.0,
      stock: 36,
      productType: "Shampoo",
      volume: "200ml",
      short: "Gentle shampoo for smoother-looking hair.",
      description: "Plant-based cleansers that respect the scalp.",
      ingredients: "Aqua, Sodium Lauryl Sulfoacetate, Cocamidopropyl Betaine.",
      howToUse: "Massage into wet hair, rinse. Repeat if needed.",
      tags: ["hair", "shampoo"],
      skin: ["normal"],
      concerns: ["hydration"],
    },
    {
      name: "Nourishing Conditioner",
      slug: "nourishing-conditioner",
      brand: "clarins",
      categoryId: haircare.id,
      price: 23.0,
      stock: 36,
      productType: "Conditioner",
      volume: "200ml",
      short: "Conditioner for soft, detangled lengths.",
      description: "Complements the smoothing shampoo for a complete ritual.",
      ingredients: "Aqua, Cetearyl Alcohol, Behentrimonium Chloride, Plant Oils.",
      howToUse: "Apply after shampoo, leave 1–2 minutes, rinse.",
      tags: ["hair", "conditioner"],
      skin: ["normal"],
      concerns: ["hydration"],
    },
    {
      name: "Tinted Moisturizer SPF 20",
      slug: "tinted-moisturizer-spf",
      brand: "clarins",
      categoryId: makeup.id,
      price: 36.0,
      stock: 28,
      productType: "Tinted Moisturizer",
      volume: "50ml",
      short: "Sheer coverage with hydration and SPF.",
      description: "Evens tone while keeping skin comfortable.",
      ingredients: "Aqua, Glycerin, Titanium Dioxide, Iron Oxides.",
      howToUse: "Apply evenly after skincare as your base.",
      tags: ["makeup", "spf", "tint"],
      skin: ["normal", "dry", "combination"],
      concerns: ["sun-protection", "brightening"],
      variants: [
        { name: "Light", type: "SHADE", stock: 10 },
        { name: "Medium", type: "SHADE", stock: 10 },
        { name: "Tan", type: "SHADE", stock: 8 },
      ],
    },
    {
      name: "Eye Pencil",
      slug: "eye-pencil",
      brand: "nuxe",
      categoryId: makeup.id,
      price: 18.0,
      stock: 44,
      productType: "Eye",
      volume: "1.1g",
      short: "Soft eye pencil for defined yet natural looks.",
      description: "Creamy texture that glides without tugging.",
      ingredients: "Hydrogenated Palm Kernel Glycerides, CI 77499, Tocopherol.",
      howToUse: "Apply along the lash line. Smudge for a softer finish.",
      tags: ["makeup", "eye"],
      skin: ["normal", "sensitive"],
      concerns: [],
      variants: [
        { name: "Noir", type: "SHADE", stock: 22 },
        { name: "Brun", type: "SHADE", stock: 22 },
      ],
    },
    {
      name: "Hand Cream",
      slug: "hand-cream",
      brand: "caudalie",
      categoryId: body.id,
      price: 12.0,
      stock: 50,
      productType: "Hand Cream",
      volume: "50ml",
      short: "Nourishing hand cream with grape seed oil.",
      description: "Non-greasy cream for soft hands.",
      ingredients: "Aqua, Glycerin, Vitis Vinifera Seed Oil, Shea Butter.",
      howToUse: "Apply whenever hands feel dry.",
      tags: ["body", "hands"],
      skin: ["dry", "normal", "sensitive"],
      concerns: ["hydration"],
    },
    {
      name: "Calming Night Cream",
      slug: "calming-night-cream",
      brand: "avene",
      categoryId: moisturizers.id,
      price: 27.5,
      stock: 31,
      productType: "Night Cream",
      volume: "40ml",
      short: "Overnight cream for sensitive, uncomfortable skin.",
      description: "Rich yet breathable texture to restore comfort by morning.",
      ingredients: "Avène Thermal Spring Water, Glycerin, Shea Butter, Niacinamide.",
      howToUse: "Apply in the evening after serum.",
      tags: ["night", "moisturizer"],
      skin: ["sensitive", "dry", "normal"],
      concerns: ["redness", "skin-barrier", "hydration"],
      featured: true,
    },
    {
      name: "Oil Control Mattifying Fluid",
      slug: "oil-control-mattifying-fluid",
      brand: "la-roche-posay",
      categoryId: moisturizers.id,
      price: 19.5,
      compareAt: 23.0,
      stock: 40,
      productType: "Moisturizer",
      volume: "40ml",
      short: "Lightweight fluid that helps control shine.",
      description: "Mattifies without over-drying oily and combination skin.",
      ingredients: "Aqua, Silica, Glycerin, Niacinamide, Zinc PCA.",
      howToUse: "Apply morning and evening after cleansing.",
      tags: ["moisturizer", "mattifying"],
      skin: ["oily", "combination"],
      concerns: ["oil-control"],
    },
    {
      name: "Exfoliating Toner",
      slug: "exfoliating-toner",
      brand: "the-ordinary",
      categoryId: skincare.id,
      price: 13.9,
      stock: 52,
      productType: "Toner",
      volume: "240ml",
      short: "A gentle AHA/BHA toner for smoother-looking skin.",
      description: "Chemical exfoliation to refine texture. Patch test first.",
      ingredients: "Aqua, Glycolic Acid, Lactic Acid, Salicylic Acid, Glycerin.",
      howToUse: "Use in the evening on clean skin. Follow with moisturiser and SPF by day.",
      tags: ["toner", "exfoliant"],
      skin: ["normal", "combination", "oily"],
      concerns: ["brightening", "blemishes"],
    },
  ];

  const skinBySlug = Object.fromEntries(skinTypes.map((s) => [s.slug, s.id]));
  const concernBySlug = Object.fromEntries(concerns.map((c) => [c.slug, c.id]));

  const createdProducts = [];
  for (const [index, p] of products.entries()) {
    const created = await prisma.product.create({
      data: {
        name: p.name,
        slug: p.slug,
        sku: `SY-${String(index + 1).padStart(4, "0")}`,
        shortDescription: p.short,
        description: p.description,
        ingredients: p.ingredients,
        howToUse: p.howToUse,
        productType: p.productType,
        volume: p.volume,
        price: p.price,
        compareAtPrice: p.compareAt ?? null,
        cost: Number((p.price * 0.45).toFixed(2)),
        stock: p.stock,
        status: "ACTIVE",
        featured: p.featured ?? false,
        bestSeller: p.bestSeller ?? false,
        tags: p.tags,
        brandId: brand(p.brand).id,
        categoryId: p.categoryId,
        publishedAt: new Date(Date.now() - index * 86400000 * 2),
        seoTitle: `${p.name} · SoYoung`,
        seoDescription: p.short,
        images: {
          create: [
            {
              url: productImage(p),
              alt: p.name,
              sortOrder: 0,
              isPrimary: true,
            },
            {
              url: productImage(p),
              alt: `${p.name} detail`,
              sortOrder: 1,
            },
          ],
        },
        skinTypes: {
          create: p.skin.map((s) => ({ skinTypeId: skinBySlug[s] })),
        },
        concerns: {
          create: p.concerns.map((c) => ({ concernId: concernBySlug[c] })),
        },
        variants: p.variants
          ? {
              create: p.variants.map((v, vi) => ({
                name: v.name,
                type: v.type,
                sku: `SY-${String(index + 1).padStart(4, "0")}-${vi + 1}`,
                price: v.price ?? p.price,
                stock: v.stock,
              })),
            }
          : undefined,
      },
    });
    createdProducts.push(created);
  }

  await prisma.review.createMany({
    data: [
      {
        productId: createdProducts[0].id,
        userId: customer.id,
        rating: 5,
        title: "Lovely texture",
        comment: "Absorbs quickly and leaves my skin comfortable all day.",
        status: "APPROVED",
        verifiedPurchase: true,
      },
      {
        productId: createdProducts[3].id,
        userId: customer.id,
        rating: 4,
        title: "Reliable daily cream",
        comment: "Simple, effective moisturiser. Will repurchase.",
        status: "APPROVED",
        verifiedPurchase: true,
      },
      {
        productId: createdProducts[4].id,
        userId: customer.id,
        rating: 5,
        title: "Great under makeup",
        comment: "No white cast and sits well under foundation.",
        status: "APPROVED",
        verifiedPurchase: true,
      },
    ],
  });

  await prisma.coupon.createMany({
    data: [
      {
        code: "WELCOME10",
        type: "PERCENTAGE",
        value: 10,
        minOrderAmount: 30,
        usageLimit: 1000,
        active: true,
      },
      {
        code: "SAVE15",
        type: "FIXED",
        value: 15,
        minOrderAmount: 60,
        usageLimit: 500,
        active: true,
      },
      {
        code: "FREESHIP",
        type: "FIXED",
        value: 4.9,
        minOrderAmount: 0,
        usageLimit: 200,
        active: true,
      },
    ],
  });

  const order = await prisma.order.create({
    data: {
      orderNumber: "SY-DEMO-0001",
      userId: customer.id,
      email: customer.email,
      status: "PROCESSING",
      paymentStatus: "PAID",
      subtotal: 47.8,
      shippingAmount: 0,
      discountAmount: 0,
      total: 47.8,
      shippingName: "Elena Papadopoulos",
      shippingLine1: "12 Kolonaki Square",
      shippingCity: "Athens",
      shippingPostal: "10673",
      shippingCountry: "GR",
      paidAt: new Date(Date.now() - 86400000 * 2),
      items: {
        create: [
          {
            productId: createdProducts[0].id,
            productName: createdProducts[0].name,
            brandName: "The Ordinary",
            sku: createdProducts[0].sku,
            image: productImage(products[0]),
            unitPrice: 28.9,
            quantity: 1,
            totalPrice: 28.9,
          },
          {
            productId: createdProducts[3].id,
            productName: createdProducts[3].name,
            brandName: "CeraVe",
            sku: createdProducts[3].sku,
            image: productImage(products[3]),
            unitPrice: 18.9,
            quantity: 1,
            totalPrice: 18.9,
          },
        ],
      },
      payment: {
        create: {
          provider: "stripe",
          providerPaymentId: "mock_pi_seed",
          status: "PAID",
          amount: 47.8,
          method: "card",
        },
      },
      timeline: {
        create: [
          { status: "PENDING", note: "Order placed", createdAt: new Date(Date.now() - 86400000 * 3) },
          { status: "PAID", note: "Payment confirmed", createdAt: new Date(Date.now() - 86400000 * 2) },
          { status: "PROCESSING", note: "Preparing shipment", createdAt: new Date(Date.now() - 86400000) },
        ],
      },
    },
  });

  await prisma.popularSearch.createMany({
    data: [
      { query: "serum", count: 120 },
      { query: "spf", count: 95 },
      { query: "cleanser", count: 80 },
      { query: "cerave", count: 70 },
    ],
  });

  await prisma.siteSetting.create({
    data: {
      key: "store",
      value: { name: "SoYoung", currency: "EUR", freeShippingThreshold: 50 },
    },
  });

  console.log(`Seeded ${createdProducts.length} products, admin=${admin.email}, customer=${customer.email}, order=${order.orderNumber}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

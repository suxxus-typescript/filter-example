import sanitizeHtml from "sanitize-html";

import {
  DummyProducts,
  DummyProduct,
  Maybe,
  Nothing,
  ProductId,
  Product,
  DictProducts,
  Category,
  CategoryProducts,
  Model,
} from "./types";

// helpers
// ----------
//
function isNumber(value: unknown) {
  return typeof value === "number" && !isNaN(value);
}

export function stringToFloat(str: string): Maybe<number> {
  if (str.length) {
    const parsedStr = parseFloat(str);
    return isNumber(parsedStr) ? parsedStr : Nothing;
  }

  return Nothing;
}

function isString(value: unknown) {
  return typeof value === "string";
}

export function doSatinizeHtml(str: string) {
  return sanitizeHtml(str, {
    allowedTags: sanitizeHtml.defaults.allowedTags.concat(["img"]),
    allowedAttributes: {
      li: ["class"],
      img: ["src", "alt", "class"],
      a: ["href", "data-category", "id"],
    },
  });
}

// ==============
//
function hasProducts(data: unknown) {
  const d: DummyProducts = data as DummyProducts;
  return d.products !== undefined;
}

export async function doGet(url: string) {
  try {
    const request = await fetch(url);
    const response = await request.json();
    return response;
  } catch (error: any) {
    console.error(error?.messatge);
  }
}

// ==============

export function getCategory(category: string): Category {
  switch (category.toLowerCase()) {
    case "smartphones":
      return "SMARTPHONES";
    case "laptops":
      return "LAPTOPS";
    case "fragrances":
      return "FRAGRANCES";
    case "groceries":
      return "GROCERIES";
    case "home-decoration":
      return "HOME-DECORATION";
    default:
      return "UNASSIGNED";
  }
}

function validateApiProducts(data: unknown): DummyProduct[] {
  //
  if (data) {
    // check if data has own property products
    const d = data as DummyProducts;
    const isList = Array.isArray(d.products);

    // if is a list, ckeck that each element of the list is of Product type
    if (isList) {
      // validate products
      return d.products.map((item) => {
        return {
          id: isNumber(item.id) ? item.id : 0,
          title: isString(item.title) ? item.title : "",
          price: isNumber(item.price) ? item.price : 0,
          category: isString(item.category) ? item.category : "",
          thumbnail: isString(item.thumbnail) ? item.thumbnail : "",
        };
      });
    } else {
      console.warn(
        `api error -> expected a list of products got ${JSON.stringify(
          d.products,
          null,
          2
        )}`
      );
    }
  }
  return [];
}

function isValidProduct(product: DummyProduct): boolean {
  switch (true) {
    case !product.id:
    case !product.price:
    case !product.category:
    case !product.thumbnail:
    case !product.title:
      return false;
    default:
      return true;
  }
}

function getProductsFromData(data: DummyProduct[]): Product[] {
  return data
    .filter(isValidProduct)
    .map(({ id, title, price, category, thumbnail }) => ({
      id,
      title,
      price,
      category: getCategory(category),
      thumbnail,
    }));
}

export function getValidProducts(data: unknown): Product[] {
  return getProductsFromData(validateApiProducts(data));
}

function doProductForCategory(products: Product[]): CategoryProducts {
  return {
    ids: products.map(({ id }) => id),
    products: products.reduce(
      (acc, { id, title, price, category, thumbnail }) => ({
        ...acc,
        [id]: {
          id,
          title,
          price,
          category,
          thumbnail,
        },
      }),
      {}
    ),
  };
}

function getProductsInCategory(products: Product[]) {
  return (category: Category): CategoryProducts =>
    doProductForCategory(products.filter((prod) => prod.category === category));
}

// List of Product -> Model
export function doStateFromProducts(products: Product[]): Model {
  const getProd = getProductsInCategory(products);

  return {
    smartphones: getProd("SMARTPHONES"),
    laptops: getProd("LAPTOPS"),
    fragrances: getProd("FRAGRANCES"),
    groceries: getProd("GROCERIES"),
    homeDecoration: getProd("HOME-DECORATION"),
    ids: [
      "SMARTPHONES",
      "LAPTOPS",
      "FRAGRANCES",
      "GROCERIES",
      "HOME-DECORATION",
    ],
  };
}

//
// filters
// =============
//
export function getByCategory(
  model: Model,
  category: Category
): CategoryProducts {
  switch (category) {
    case "SMARTPHONES":
      return model.smartphones;
    case "LAPTOPS":
      return model.laptops;
    case "FRAGRANCES":
      return model.fragrances;
    case "GROCERIES":
      return model.groceries;
    case "HOME-DECORATION":
      return model.homeDecoration;
    case "UNASSIGNED":
      return { products: {}, ids: [] };
  }
}

export function getProductsById(
  products: DictProducts,
  id: ProductId
): Maybe<Product> {
  return products[id] || Nothing;
}

export function getAllProductsInCategory({
  ids,
  products,
}: CategoryProducts): Maybe<Product>[] {
  return ids.map((id) => getProductsById(products, id));
}

export function getValidProductsFromList(
  products: Maybe<Product>[]
): Product[] {
  const productsValidated: Product[] = [];
  products.forEach((product) => {
    if (product !== Nothing) {
      productsValidated.push(product);
    }
  });
  return productsValidated;
}

export function getCategoryProducts(
  categoryProducts: CategoryProducts
): Product[] {
  return getValidProductsFromList(getAllProductsInCategory(categoryProducts));
}

export function getAllProducts(model: Model): Product[] {
  const { ids } = model;
  return getValidProductsFromList(
    ids.map((id) => getAllProductsInCategory(getByCategory(model, id))).flat()
  );
}

function getProductByPricesInAscendingOrder(products: Product[]): Product[] {
  return products.sort((a, b) => a.price - b.price);
}

function getProductsUpTo(products: Product[], priceLimit: number) {
  return products.filter((product) => Math.ceil(product.price) <= priceLimit);
}

export function getProductsByPrice(products: Product[], price: number) {
  return getProductByPricesInAscendingOrder(getProductsUpTo(products, price));
}

export function doSearchProductByTitle(
  str: string,
  products: Product[]
): Product[] {
  //
  const minLenghth = 3;
  const productLen = products.length;
  let i = 0;

  const found: Product[] = [];
  //
  if (str.length >= minLenghth) {
    while (i < productLen) {
      const product: Product = products[i];
      const title = product?.title.toUpperCase() || "";
      if (title.includes(str.toUpperCase())) {
        found.push(product);
      }
      i++;
    }
  }

  return found;
}

export const Nothing = Symbol("nothing");

type Nothing = typeof Nothing;

export type Maybe<T> = T | Nothing;

export type Category =
  | "SMARTPHONES"
  | "LAPTOPS"
  | "FRAGRANCES"
  | "GROCERIES"
  | "HOME-DECORATION"
  | "UNASSIGNED";

// from API
export type DummyProduct = {
  id: number;
  title: string;
  price: number;
  category: string;
  thumbnail: string;
};

export type DummyProducts = {
  products: DummyProduct[];
};

export type ProductId = number;

export type Product = {
  id: ProductId;
  title: string;
  price: number;
  category: Category;
  thumbnail: string;
};

export type DictProducts = Record<ProductId, Product>;

export type CategoryProducts = {
  products: DictProducts;
  ids: ProductId[];
};

export type Model = {
  smartphones: CategoryProducts;
  laptops: CategoryProducts;
  fragrances: CategoryProducts;
  groceries: CategoryProducts;
  homeDecoration: CategoryProducts;
  ids: Category[];
};

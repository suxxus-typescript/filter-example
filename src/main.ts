import "the-new-css-reset/css/reset.css";
import "./style.css";

import {
  Model,
  Product,
  Category,
  Maybe,
  CategoryProducts,
  Nothing,
} from "./types";

import {
  stringToFloat,
  doSatinizeHtml,
  doGet,
  doStateFromProducts,
  doSearchProductByTitle,
  getCategory,
  getValidProducts,
  getAllProducts,
  getCategoryProducts,
  getByCategory,
  getProductsById,
  getProductsByPrice,
} from "./filters";

// constants
// ===========
const URL_PRODUCTS = "https://dummyjson.com/products";

// App
// ====
((doc) => {
  let state: Model;
  let selectedCategory: Category = "UNASSIGNED";

  const Spinner: HTMLDivElement =
    doc.querySelector(".loading-spinner") || doc.createElement("div");

  const ProductsContainer: HTMLUListElement =
    doc.querySelector(".grid-container") || doc.createElement("ul");

  const LeftCol: HTMLDivElement | null = doc.querySelector(".left-menu");

  const RightCol: HTMLDivElement =
    doc.querySelector(".right-pane") || doc.createElement("div");

  const RangePriceSelector: HTMLDivElement =
    LeftCol?.querySelector(".price-range-selector") || doc.createElement("div");

  const SelectedPrice: HTMLSpanElement =
    RangePriceSelector.querySelector("#selectedPrice") ||
    doc.createElement("span");

  const PriceInput: HTMLInputElement =
    RangePriceSelector.querySelector("#priceInput") ||
    doc.createElement("input");

  const Search: HTMLInputElement =
    LeftCol?.querySelector("#searchByTitle") || doc.createElement("input");

  //==================
  const doProducts = (products: Product[]): string =>
    products
      .map(({ id, thumbnail, title, price, category }) => {
        return `<li class="grid-item">
            <a id="${id}" data-category="${category}" href="#">
              <img 
                class="grid-item-img-mini"
                src="${thumbnail}"
                alt="img"
              />
            </a>
            <ul>
             <li>${title}</li>
             <li class="product-price">$${price}</li>
            </ul>
          </li>`;
      })
      .join("");

  const onProductEventListener = (productsList: HTMLUListElement) => {
    const ProductList: NodeListOf<HTMLAnchorElement> =
      productsList.querySelectorAll(".grid-item a");

    ProductList.forEach((item: HTMLElement) => {
      item.addEventListener("click", (evt) => {
        evt.preventDefault();
        productListener(evt);
      });
    });
  };

  const addProductsToProductContainer = (products: Product[]) => {
    ProductsContainer.innerHTML = doSatinizeHtml(doProducts(products));
    onProductEventListener(ProductsContainer);
  };

  const productListener = (evt: MouseEvent) => {
    const category: Category = getCategory(
      (evt.currentTarget as HTMLAnchorElement).dataset.category || ""
    );

    const currentId = (evt.currentTarget as HTMLAnchorElement).id;
    const id = stringToFloat(currentId);

    if (id === Nothing) {
      console.warn(
        `expected an string to be parsed to number type, got ${currentId}`
      );
    } else {
      const prodcutsByCategory: CategoryProducts = getByCategory(
        state,
        category
      );

      const prod: Maybe<Product> = getProductsById(
        prodcutsByCategory.products,
        id
      );

      if (prod === Nothing) {
        console.warn(`produtc ${id} in category ${category}, not found`);
      } else {
        const { thumbnail, title, price }: Product = prod;

        const PopUp: HTMLDivElement =
          RightCol.querySelector(".product-popup") || doc.createElement("div");

        const PopUpCloseBtn: HTMLButtonElement =
          PopUp.querySelector(".product-popup__ctrls") ||
          doc.createElement("button");

        const ProdContainer: HTMLDivElement =
          PopUp.querySelector(".product-popup__container") ||
          doc.createElement("div");

        PopUpCloseBtn.addEventListener("click", (evt: MouseEvent) => {
          evt.preventDefault();
          PopUp.style.removeProperty("top");
        });

        ProdContainer.innerHTML = doSatinizeHtml(`
            <img
                class="grid-item-img-maxi"
                src="${thumbnail}"
                alt="img"
              />
            </a>
            <ul>
             <li>${title}</li>
             <li class="product-price">$${price}</li>
            </ul>
            `);

        PopUp.style.top = "0";
      }
    }
  };

  const setMaxMinValueToPriceRange = (products: Product[]) => {
    //
    const buffer = 2;
    const prices: number[] = products.map(({ price }) => price);
    const maxPrice = Math.ceil(Math.max.apply(null, prices) + buffer);
    const minPrice = Math.floor(Math.min.apply(null, prices) - buffer);

    PriceInput.max = maxPrice.toString();
    PriceInput.min = minPrice.toString();
    PriceInput.value = (maxPrice / 2).toString();
    SelectedPrice.textContent = maxPrice.toString();
  };

  const addPriceRangeEventListener = () => {
    PriceInput.addEventListener("change", (evt) => {
      evt.preventDefault();
      const target = evt.target as HTMLInputElement;
      const price = target.value;
      SelectedPrice.textContent = price;

      const products: Product[] =
        selectedCategory === "UNASSIGNED"
          ? getAllProducts(state)
          : getCategoryProducts(getByCategory(state, selectedCategory));

      const priceToNumber = stringToFloat(price);

      if (priceToNumber === Nothing) {
        console.warn(
          `expected an string to be parsed to number type, got ${price}`
        );
      } else {
        addProductsToProductContainer(
          getProductsByPrice(products, priceToNumber)
        );
      }
    });
  };

  const addMainMenuEventListener = () => {
    const MenuItems: NodeListOf<HTMLAnchorElement> = doc.querySelectorAll(
      ".categories-names a"
    );

    MenuItems.forEach((item: HTMLElement) => {
      item.addEventListener("click", (evt: MouseEvent) => {
        evt.preventDefault();
        const selected = (evt.target as HTMLElement).id;
        let products: Product[] = [];

        switch (selected) {
          case "all":
            products = products.concat(getAllProducts(state));
            selectedCategory = "UNASSIGNED";
            break;
          case "smartphones":
            products = products.concat(getCategoryProducts(state.smartphones));
            selectedCategory = "SMARTPHONES";
            break;
          case "laptops":
            products = products.concat(getCategoryProducts(state.laptops));
            selectedCategory = "LAPTOPS";
            break;
          case "fragrances":
            products = products.concat(getCategoryProducts(state.fragrances));
            selectedCategory = "FRAGRANCES";
            break;
          case "groceries":
            products = products.concat(getCategoryProducts(state.groceries));
            selectedCategory = "GROCERIES";
            break;
          case "home-decoration":
            products = products.concat(
              getCategoryProducts(state.homeDecoration)
            );
            selectedCategory = "HOME-DECORATION";
            break;
        }

        if (products.length === 0) {
          console.warn(
            `"${selected}" is no defined on the switcher statement --> no products list`
          );
        } else {
          setMaxMinValueToPriceRange(products);
          addProductsToProductContainer(products);
        }
      });
    });
  };

  const doSelectProducts = (products: Product[]) => {
    // to search by title
    const List: HTMLUListElement =
      LeftCol?.querySelector("#availableProducts") || doc.createElement("ul");

    List.innerHTML = doSatinizeHtml(
      products
        .map(
          ({ id, title, category }) =>
            `<li>
              <a href="#" id="${id}" data-category="${category}">${title}</a>
            </li>`
        )
        .join("")
    );

    const availableProducts = List.querySelectorAll("a");

    availableProducts.forEach((item) => {
      item.addEventListener("click", (evt) => {
        evt.preventDefault();
        productListener(evt);
      });
    });
  };

  const addSearchEventListener = () => {
    Search.addEventListener("input", (evt) => {
      evt.preventDefault();

      const target = evt.target as HTMLInputElement;
      const value = target.value;

      const products: Product[] =
        selectedCategory === "UNASSIGNED"
          ? getAllProducts(state)
          : getCategoryProducts(getByCategory(state, selectedCategory));
      const listOfProducts: Product[] = doSearchProductByTitle(value, products);

      doSelectProducts(listOfProducts);
    });
  };

  //
  const startApp = () => {
    doGet(URL_PRODUCTS).then((data: unknown) => {
      state = doStateFromProducts(getValidProducts(data));

      const products: Product[] = getAllProducts(state);

      addMainMenuEventListener();
      addProductsToProductContainer(products);

      setMaxMinValueToPriceRange(products);
      addPriceRangeEventListener();

      Search.value = "";
      addSearchEventListener();

      Spinner.style.display = "none";
    });
  };

  startApp();
})(window.document);

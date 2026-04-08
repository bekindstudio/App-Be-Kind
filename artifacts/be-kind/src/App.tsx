import { Switch, Route, Router as WouterRouter } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/not-found";
import { MobileLayout } from "@/components/mobile-layout";
import { AuthProvider } from "@/components/auth-provider";

import Home from "@/pages/home";
import Login from "@/pages/login";
import Register from "@/pages/register";
import Menu from "@/pages/menu";
import DishDetail from "@/pages/dish-detail";
import Cart from "@/pages/cart";
import Checkout from "@/pages/checkout";
import Orders from "@/pages/orders";
import OrderDetail from "@/pages/order-detail";
import Profile from "@/pages/profile";
import Shop from "@/pages/shop";
import ProductDetail from "@/pages/product-detail";
import ShopCart from "@/pages/shop-cart";
import Events from "@/pages/events";
import EventDetail from "@/pages/event-detail";
import Reservations from "@/pages/reservations";
import NewReservation from "@/pages/new-reservation";
import Loyalty from "@/pages/loyalty";
import EditProfile from "@/pages/edit-profile";
import AdminDashboard from "@/pages/admin/index";
import AdminDishes from "@/pages/admin/dishes";
import AdminDishForm from "@/pages/admin/dish-form";
import AdminEvents from "@/pages/admin/events-list";
import AdminEventForm from "@/pages/admin/event-form";
import AdminProducts from "@/pages/admin/products-list";
import AdminProductForm from "@/pages/admin/product-form";
import AdminOrders from "@/pages/admin/orders";
import AdminShopOrders from "@/pages/admin/shop-orders";
import AdminReservationsPage from "@/pages/admin/reservations";
import AdminUsersList from "@/pages/admin/users-list";
import AdminCategories from "@/pages/admin/categories";
import AdminScanner from "@/pages/admin/scanner";

const queryClient = new QueryClient();

function Router() {
  return (
    <MobileLayout>
      <Switch>
        <Route path="/" component={Home} />
        <Route path="/login" component={Login} />
        <Route path="/register" component={Register} />
        <Route path="/menu" component={Menu} />
        <Route path="/menu/:id" component={DishDetail} />
        <Route path="/cart" component={Cart} />
        <Route path="/order/checkout" component={Checkout} />
        <Route path="/orders" component={Orders} />
        <Route path="/orders/:id" component={OrderDetail} />
        <Route path="/shop" component={Shop} />
        <Route path="/shop/cart" component={ShopCart} />
        <Route path="/shop/:id" component={ProductDetail} />
        <Route path="/events" component={Events} />
        <Route path="/events/:id" component={EventDetail} />
        <Route path="/profile" component={Profile} />
        <Route path="/profile/edit" component={EditProfile} />
        <Route path="/loyalty" component={Loyalty} />
        <Route path="/reservations" component={Reservations} />
        <Route path="/reservations/new" component={NewReservation} />
        <Route path="/admin" component={AdminDashboard} />
        <Route path="/admin/piatti" component={AdminDishes} />
        <Route path="/admin/piatti/:id" component={AdminDishForm} />
        <Route path="/admin/eventi" component={AdminEvents} />
        <Route path="/admin/eventi/:id" component={AdminEventForm} />
        <Route path="/admin/prodotti" component={AdminProducts} />
        <Route path="/admin/prodotti/:id" component={AdminProductForm} />
        <Route path="/admin/ordini" component={AdminOrders} />
        <Route path="/admin/ordini-bottega" component={AdminShopOrders} />
        <Route path="/admin/prenotazioni" component={AdminReservationsPage} />
        <Route path="/admin/utenti" component={AdminUsersList} />
        <Route path="/admin/categorie" component={AdminCategories} />
        <Route path="/admin/scanner" component={AdminScanner} />
        <Route component={NotFound} />
      </Switch>
    </MobileLayout>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <TooltipProvider>
          <WouterRouter base={import.meta.env.BASE_URL?.replace(/\/$/, "") || ""}>
            <Router />
          </WouterRouter>
          <Toaster />
        </TooltipProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;

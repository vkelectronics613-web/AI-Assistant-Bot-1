import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useQueryClient } from "@tanstack/react-query";
import {
  useListProducts,
  useCreateProduct,
  useUpdateProduct,
  useDeleteProduct,
  getListProductsQueryKey,
} from "@workspace/api-client-react";
import {
  Plus, Search, Package, LayoutGrid, List, Pencil, Trash2, CheckCircle, XCircle,
} from "lucide-react";

const productSchema = z.object({
  name: z.string().min(1, "Name is required"),
  description: z.string().optional(),
  price: z.coerce.number().min(0),
  category: z.string().optional(),
  variants: z.string().optional(),
  inStock: z.boolean().default(true),
});

type ProductFormValues = z.infer<typeof productSchema>;

function ProductForm({ onSuccess, defaultValues, productId }: {
  onSuccess: () => void;
  defaultValues?: Partial<ProductFormValues>;
  productId?: number;
}) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const create = useCreateProduct();
  const update = useUpdateProduct();

  const form = useForm<ProductFormValues>({
    resolver: zodResolver(productSchema),
    defaultValues: { inStock: true, ...defaultValues },
  });

  function onSubmit(values: ProductFormValues) {
    const action = productId
      ? update.mutateAsync({ id: productId, data: values })
      : create.mutateAsync({ data: values });
    action.then(() => {
      queryClient.invalidateQueries({ queryKey: getListProductsQueryKey() });
      toast({ title: productId ? "Product updated" : "Product created" });
      onSuccess();
    }).catch(() => toast({ title: "Error", description: "Could not save product", variant: "destructive" }));
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField control={form.control} name="name" render={({ field }) => (
          <FormItem>
            <FormLabel>Name</FormLabel>
            <FormControl><Input placeholder="Product name" {...field} data-testid="input-product-name" /></FormControl>
            <FormMessage />
          </FormItem>
        )} />
        <FormField control={form.control} name="description" render={({ field }) => (
          <FormItem>
            <FormLabel>Description</FormLabel>
            <FormControl><Input placeholder="Short description" {...field} data-testid="input-product-description" /></FormControl>
          </FormItem>
        )} />
        <div className="grid grid-cols-2 gap-4">
          <FormField control={form.control} name="price" render={({ field }) => (
            <FormItem>
              <FormLabel>Price ($)</FormLabel>
              <FormControl><Input type="number" step="0.01" placeholder="0.00" {...field} data-testid="input-product-price" /></FormControl>
              <FormMessage />
            </FormItem>
          )} />
          <FormField control={form.control} name="category" render={({ field }) => (
            <FormItem>
              <FormLabel>Category</FormLabel>
              <FormControl><Input placeholder="Electronics" {...field} data-testid="input-product-category" /></FormControl>
            </FormItem>
          )} />
        </div>
        <FormField control={form.control} name="variants" render={({ field }) => (
          <FormItem>
            <FormLabel>Variants</FormLabel>
            <FormControl><Input placeholder="e.g. Black, White, Blue" {...field} data-testid="input-product-variants" /></FormControl>
          </FormItem>
        )} />
        <FormField control={form.control} name="inStock" render={({ field }) => (
          <FormItem className="flex items-center justify-between rounded-lg border border-border p-3">
            <FormLabel className="cursor-pointer">In Stock</FormLabel>
            <FormControl>
              <Switch checked={field.value} onCheckedChange={field.onChange} data-testid="switch-in-stock" />
            </FormControl>
          </FormItem>
        )} />
        <Button type="submit" className="w-full" disabled={create.isPending || update.isPending} data-testid="button-save-product">
          {productId ? "Update Product" : "Add Product"}
        </Button>
      </form>
    </Form>
  );
}

export default function Products() {
  const [search, setSearch] = useState("");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editProduct, setEditProduct] = useState<{ id: number; values: ProductFormValues } | null>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const deleteProduct = useDeleteProduct();

  const { data: products, isLoading } = useListProducts(
    search ? { search } : {},
    { query: { queryKey: getListProductsQueryKey(search ? { search } : {}) } }
  );

  function handleDelete(id: number, name: string) {
    if (!confirm(`Delete "${name}"?`)) return;
    deleteProduct.mutate({ id }, {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getListProductsQueryKey() });
        toast({ title: "Product deleted" });
      },
      onError: () => toast({ title: "Error", description: "Could not delete", variant: "destructive" }),
    });
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Products</h1>
          <p className="text-muted-foreground">Manage your product catalog for AI-powered responses.</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={(v) => { setDialogOpen(v); if (!v) setEditProduct(null); }}>
          <DialogTrigger asChild>
            <Button data-testid="button-add-product" onClick={() => setEditProduct(null)}>
              <Plus className="h-4 w-4 mr-2" /> Add Product
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>{editProduct ? "Edit Product" : "Add New Product"}</DialogTitle>
            </DialogHeader>
            <ProductForm
              defaultValues={editProduct?.values}
              productId={editProduct?.id}
              onSuccess={() => setDialogOpen(false)}
            />
          </DialogContent>
        </Dialog>
      </div>

      <div className="flex items-center gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search products..."
            className="pl-9"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            data-testid="input-search-products"
          />
        </div>
        <div className="flex border border-border rounded-md overflow-hidden">
          <Button
            variant={viewMode === "grid" ? "secondary" : "ghost"}
            size="icon"
            className="rounded-none h-9 w-9"
            onClick={() => setViewMode("grid")}
            data-testid="button-grid-view"
          >
            <LayoutGrid className="h-4 w-4" />
          </Button>
          <Button
            variant={viewMode === "list" ? "secondary" : "ghost"}
            size="icon"
            className="rounded-none h-9 w-9"
            onClick={() => setViewMode("list")}
            data-testid="button-list-view"
          >
            <List className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {isLoading ? (
        <div className={viewMode === "grid" ? "grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4" : "space-y-3"}>
          {[1, 2, 3, 4].map(i => <Skeleton key={i} className={viewMode === "grid" ? "h-48" : "h-16"} />)}
        </div>
      ) : !products?.length ? (
        <Card className="glass-panel">
          <CardContent className="flex flex-col items-center justify-center py-16 text-muted-foreground">
            <Package className="h-12 w-12 mb-4 opacity-20" />
            <p className="text-lg font-medium">No products yet</p>
            <p className="text-sm mt-1">Add your first product to enable AI catalog responses.</p>
          </CardContent>
        </Card>
      ) : viewMode === "grid" ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {products.map((product) => (
            <Card key={product.id} className="glass-panel group hover:border-primary/30 transition-all" data-testid={`card-product-${product.id}`}>
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                    <Package className="h-5 w-5 text-primary" />
                  </div>
                  <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Button variant="ghost" size="icon" className="h-7 w-7" data-testid={`button-edit-product-${product.id}`}
                      onClick={() => {
                        setEditProduct({ id: product.id, values: { name: product.name, description: product.description ?? "", price: product.price, category: product.category ?? "", variants: product.variants ?? "", inStock: product.inStock } });
                        setDialogOpen(true);
                      }}>
                      <Pencil className="h-3.5 w-3.5" />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive hover:text-destructive" data-testid={`button-delete-product-${product.id}`}
                      onClick={() => handleDelete(product.id, product.name)}>
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>
                <CardTitle className="text-sm font-medium mt-3">{product.name}</CardTitle>
                {product.description && <p className="text-xs text-muted-foreground line-clamp-2">{product.description}</p>}
              </CardHeader>
              <CardContent className="pt-0 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-lg font-bold text-primary">${product.price.toFixed(2)}</span>
                  {product.inStock ? (
                    <Badge variant="outline" className="bg-green-500/10 text-green-400 border-green-500/20 text-[10px]">
                      <CheckCircle className="h-3 w-3 mr-1" /> In Stock
                    </Badge>
                  ) : (
                    <Badge variant="outline" className="bg-red-500/10 text-red-400 border-red-500/20 text-[10px]">
                      <XCircle className="h-3 w-3 mr-1" /> Out of Stock
                    </Badge>
                  )}
                </div>
                {product.category && <Badge variant="secondary" className="text-[10px]">{product.category}</Badge>}
                {product.variants && <p className="text-[10px] text-muted-foreground">{product.variants}</p>}
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card className="glass-panel">
          <div className="divide-y divide-border">
            {products.map((product) => (
              <div key={product.id} className="flex items-center justify-between p-4 hover:bg-secondary/20 transition-colors group" data-testid={`row-product-${product.id}`}>
                <div className="flex items-center gap-4">
                  <div className="h-9 w-9 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                    <Package className="h-4 w-4 text-primary" />
                  </div>
                  <div>
                    <p className="font-medium text-sm">{product.name}</p>
                    <p className="text-xs text-muted-foreground">{product.category || "Uncategorized"}</p>
                  </div>
                </div>
                <div className="flex items-center gap-6">
                  <span className="font-semibold text-primary">${product.price.toFixed(2)}</span>
                  {product.inStock ? (
                    <Badge variant="outline" className="bg-green-500/10 text-green-400 border-green-500/20 text-[10px]">In Stock</Badge>
                  ) : (
                    <Badge variant="outline" className="bg-red-500/10 text-red-400 border-red-500/20 text-[10px]">Out of Stock</Badge>
                  )}
                  <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Button variant="ghost" size="icon" className="h-7 w-7" data-testid={`button-edit-list-product-${product.id}`}
                      onClick={() => {
                        setEditProduct({ id: product.id, values: { name: product.name, description: product.description ?? "", price: product.price, category: product.category ?? "", variants: product.variants ?? "", inStock: product.inStock } });
                        setDialogOpen(true);
                      }}>
                      <Pencil className="h-3.5 w-3.5" />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive hover:text-destructive" data-testid={`button-delete-list-product-${product.id}`}
                      onClick={() => handleDelete(product.id, product.name)}>
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
}

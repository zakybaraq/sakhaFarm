import { useState, useEffect } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Box,
} from "@mui/material";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { listPlasmas, type Plasma } from "../../api/plasmas";
import { listFeedProducts, type FeedProduct } from "../../api/feed";
import { apiClient } from "../../api/client";
import { useAuth } from "../../contexts/AuthContext";

const suratJalanSchema = z.object({
  tanggal: z.string().min(1, "Tanggal wajib diisi"),
  nomorSJ: z.string().min(1, "Nomor SJ wajib diisi"),
  plasmaId: z.number().min(1, "Plasma wajib dipilih"),
  feedProductId: z.number().min(1, "Jenis pakan wajib dipilih"),
  jumlahZak: z.number().min(1, "Jumlah zak wajib diisi"),
  supplier: z.string().min(1, "Supplier wajib diisi"),
});

type SuratJalanFormData = z.infer<typeof suratJalanSchema>;

interface SuratJalanModalProps {
  open: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export function SuratJalanModal({
  open,
  onClose,
  onSuccess,
}: SuratJalanModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [plasmas, setPlasmas] = useState<Plasma[]>([]);
  const [feedProducts, setFeedProducts] = useState<FeedProduct[]>([]);
  const { user } = useAuth();

  // Fetch plasmas and feed products when component mounts or user changes
  useEffect(() => {
    const fetchData = async () => {
      if (user?.tenantId) {
        // Fetch plasmas
        try {
          const plasmasData = await listPlasmas();
          setPlasmas(plasmasData.plasmas);
        } catch (error) {
          console.error("Failed to fetch plasmas:", error);
        }

        // Fetch feed products
        try {
          const feedProductsData = await listFeedProducts();
          setFeedProducts(feedProductsData.products);
        } catch (error) {
          console.error("Failed to fetch feed products:", error);
        }
      }
    };

    fetchData();
  }, [user?.tenantId]);

  const {
    control,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<SuratJalanFormData>({
    resolver: zodResolver(suratJalanSchema),
    defaultValues: {
      tanggal: new Date().toISOString().split("T")[0],
      nomorSJ: "",
      plasmaId: 0,
      feedProductId: 0,
      jumlahZak: 0,
      supplier: "",
    },
  });

  const onSubmit = async (data: SuratJalanFormData) => {
    setIsSubmitting(true);
    try {
      const selectedProduct = feedProducts.find((p) => p.id === data.feedProductId);
      const conversion = parseFloat(selectedProduct?.zakKgConversion || '50');
      
      await apiClient('/feed/surat-jalan', {
        method: 'POST',
        body: JSON.stringify({
          plasmaId: data.plasmaId,
          feedProductId: data.feedProductId,
          suratJalanNumber: data.nomorSJ,
          vendor: data.supplier,
          deliveryDate: data.tanggal,
          totalZak: data.jumlahZak,
          totalKg: data.jumlahZak * conversion,
        }),
      });
      
      reset();
      onSuccess?.();
      onClose();
    } catch (err: any) {
      alert(err.message || 'Terjadi kesalahan saat menyimpan');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle sx={{ fontSize: "20px", fontWeight: 600 }}>
        Tambah Surat Jalan
      </DialogTitle>
      <form onSubmit={handleSubmit(onSubmit)}>
        <DialogContent>
          <Box sx={{ display: "flex", flexDirection: "column", gap: 2, mt: 1 }}>
            <Controller
              name="tanggal"
              control={control}
              render={({ field }) => (
                <TextField
                  {...field}
                  label="Tanggal"
                  type="date"
                  fullWidth
                  error={!!errors.tanggal}
                  helperText={errors.tanggal?.message}
                  InputLabelProps={{ shrink: true }}
                />
              )}
            />

            <Controller
              name="nomorSJ"
              control={control}
              render={({ field }) => (
                <TextField
                  {...field}
                  label="Nomor Surat Jalan"
                  fullWidth
                  error={!!errors.nomorSJ}
                  helperText={errors.nomorSJ?.message}
                />
              )}
            />

            <Controller
              name="plasmaId"
              control={control}
              render={({ field }) => (
                <FormControl fullWidth error={!!errors.plasmaId}>
                  <InputLabel>Plasma</InputLabel>
                  <Select {...field} label="Plasma" value={field.value || ""}>
                    {plasmas.map((plasma) => (
                      <MenuItem key={plasma.id} value={plasma.id}>
                        {plasma.name}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              )}
            />

            <Controller
              name="feedProductId"
              control={control}
              render={({ field }) => (
                <FormControl fullWidth error={!!errors.feedProductId}>
                  <InputLabel>Jenis Pakan</InputLabel>
                  <Select
                    {...field}
                    label="Jenis Pakan"
                    value={field.value || ""}
                  >
                    {feedProducts.map((product) => (
                      <MenuItem key={product.id} value={product.id}>
                        {product.name}
                        {product.typeName ? ` (${product.typeName})` : ''}
                        {product.brandName ? ` — ${product.brandName}` : ''}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              )}
            />

            <Controller
              name="jumlahZak"
              control={control}
              render={({ field }) => (
                <TextField
                  {...field}
                  label="Jumlah Zak"
                  type="number"
                  fullWidth
                  error={!!errors.jumlahZak}
                  helperText={errors.jumlahZak?.message}
                  onChange={(e) => field.onChange(Number(e.target.value))}
                />
              )}
            />

            <Controller
              name="supplier"
              control={control}
              render={({ field }) => (
                <TextField
                  {...field}
                  label="Supplier"
                  fullWidth
                  error={!!errors.supplier}
                  helperText={errors.supplier?.message}
                />
              )}
            />
          </Box>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button variant="outlined" onClick={onClose} disabled={isSubmitting}>
            Batal
          </Button>
          <Button
            variant="contained"
            type="submit"
            disabled={isSubmitting}
            sx={{ bgcolor: "#2E7D32" }}
          >
            {isSubmitting ? "Menyimpan..." : "Simpan Surat Jalan"}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
}

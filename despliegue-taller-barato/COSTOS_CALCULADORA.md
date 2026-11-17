# Costo mensual — Taller Cloud Computing (AgroPacayales)

Estimación para **US East (N. Virginia)**, **730 horas al mes** (24/7), con la **AWS Pricing Calculator** (https://calculator.aws).

## 🏆 Resultado

| Combinación de servicios | Costo estimado / mes |
| :-- | --: |
| **A.** Diseño anterior: VPC + 2 EC2 + **RDS SQL Server** + S3 | **≥ US$ 70** |
| **B.** Todo en una EC2 (On-Demand) + S3 + EBS + VPC | **≈ US$ 32.4** |
| **C. ⭐ Todo en una EC2 (Spot) + S3 + EBS + VPC** | **≈ US$ 16.2** |

La combinación **C** es la más barata: cuesta **la mitad que B** y **menos de la cuarta parte que A**. Está por debajo de los US$ 21 y de los US$ 32 que se comentaron en el grupo.

## 🔢 Detalle de cada combinación

Precios públicos de AWS en us-east-1 (Linux). Los valores de Spot cambian con el tiempo.

### C. Todo en una EC2 con Spot (la que se despliega por defecto)

| Servicio | Configuración | Cálculo | US$ / mes |
| :-- | :-- | :-- | --: |
| **Amazon EC2** | 1 × `t3a.medium` (2 vCPU, 4 GiB), **Spot** ≈ 0.0153 US$/h | 0.0153 × 730 | 11.17 |
| **Amazon EBS** | 16 GiB gp3 (US$ 0.08 por GiB-mes) | 16 × 0.08 | 1.28 |
| **Amazon VPC** | 1 dirección IPv4 pública (US$ 0.005 por hora) | 0.005 × 730 | 3.65 |
| **Amazon S3** | Frontend: < 1 GB Standard y pocas miles de peticiones | — | ≈ 0.05 |
| | | **Total** | **≈ 16.15** |

### B. Todo en una EC2 On-Demand

Igual que C, pero con la EC2 a precio normal: `t3a.medium` 0.0376 US$/h × 730 = **27.45** → total **≈ 32.43**.

### A. Diseño anterior (el que se descartó)

| Servicio | Configuración | US$ / mes |
| :-- | :-- | --: |
| EC2 `cc-backends` | `t3.medium` 0.0416 × 730 | 30.37 |
| EC2 `cc-mongodb` | `t3.small` 0.0208 × 730 | 15.18 |
| **Amazon RDS** SQL Server Express | `db.t3.micro`, mínimo 0.018 US$/h × 730 *(es un piso: con la licencia de SQL Server el precio real es mayor)* | ≥ 13.14 |
| RDS + EBS | 20 GiB + 28 GiB de disco | ≈ 4.5 |
| VPC (IPv4 públicas) | 2 × 3.65 | 7.30 |
| S3 | | ≈ 0.05 |
| | **Total** | **≥ 70** |

## 🧠 Por qué la combinación C es la más barata

1. **Sin RDS:** SQL Server Express (licencia gratuita) corre en un contenedor Docker dentro de la misma EC2. Se evita el cargo de RDS (≥ US$ 13) y su disco.
2. **Una sola EC2 en vez de dos:** SQL Server, MongoDB y los dos backends comparten una instancia de 4 GiB (con 2 GiB de swap). Se ahorra una instancia y una IP pública.
3. **Frontend en S3:** un sitio estático cuesta centavos; no necesita servidor.
4. **EC2 Spot:** usa capacidad sobrante de AWS con ~60 % de descuento. Si AWS la reclama, la EC2 se **detiene** (no se borra) y vuelve a arrancar sola con sus datos.
5. **EBS de 16 GiB gp3:** el tamaño justo, con el tipo de disco más barato.
6. **Instancia `t3a`:** ~10 % más barata que `t3` con la misma memoria.

> ⚠️ **No se puede bajar más la EC2:** SQL Server exige mínimo 2 GiB de RAM, y con MongoDB y los dos backends hacen falta 4 GiB.

## 🧮 Cómo armar la estimación en la calculadora (calculator.aws)

1. Entrar a https://calculator.aws → **Create estimate**.
2. **Add service → Amazon EC2** → región **US East (N. Virginia)** y configurar:
   - Operating system: **Linux** · Tenancy: **Shared Instances** · Workload: **Consistent, 100 %**
   - Instance type: **t3a.medium**
   - Pricing strategy: **On-Demand** (para B) y **Spot Instances** (para C)
   - **Amazon EBS:** General Purpose SSD **gp3**, **16 GB**
3. **Add service → Amazon S3** → S3 Standard **1 GB**, **1 000** peticiones PUT/COPY/POST/LIST, **10 000** peticiones GET.
4. **Add service → Amazon VPC** → sección *Public IPv4 Address*: **1** dirección IPv4 pública en uso.
5. Arriba verás **Total monthly cost** (≈ US$ 16 para C).
6. **Share → Copy public link** y **Export → PDF**: ese link y el PDF son la evidencia.
7. Para mostrar la **comparación**, crear otra estimación con el diseño A: 2 × EC2 + **Amazon RDS for SQL Server** (Express, `db.t3.micro`, Single-AZ, 20 GB) + 2 IPv4 + S3, y comparar los totales.

> Si la calculadora no muestra la opción **Spot Instances** en tu cuenta, usa los totales de **A** y **B** y explica que Spot baja la EC2 a ≈ 11 US$.

## ⚠️ Lo que hay que saber

- **Son estimaciones.** Los totales salen de precios públicos; el total final es el que muestre la calculadora el día de la grabación. El precio de Spot es el más variable.
- **Spot puede interrumpirse.** Con el tipo *persistent* + *stop*, la EC2 se detiene y vuelve sola. Para grabar sin riesgo, se puede desplegar con `Capacidad = OnDemand` (≈ US$ 32.4).
- **La IP pública se cobra:** desde febrero de 2024 AWS cobra US$ 0.005 por hora cada IPv4 pública.
- **Learner Lab:** los créditos del laboratorio son ficticios; la calculadora estima el costo como si fuera una cuenta real.

## 📚 Fuentes de los precios

- EC2 `t3a.medium` y `t3.medium`: [Holori](https://calculator.holori.com/aws/ec2/t3a.medium/us-east-1), [AWS aws-pricing.com](https://aws-pricing.com/t3a.medium.html), [Cloudchipr](https://instances.cloudchipr.com/aws/ec2/t3.medium)
- IPv4 pública (US$ 0.005 por hora): [AWS News Blog](https://aws.amazon.com/blogs/aws/new-aws-public-ipv4-address-charge-public-ip-insights)
- RDS `db.t3.micro` (piso 0.018 US$/h): [OpsLyft](https://www.opslyft.com/blog/amazon-rds-pricing-explained) · precios oficiales: https://aws.amazon.com/rds/sqlserver/pricing/

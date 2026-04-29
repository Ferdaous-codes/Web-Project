using Microsoft.EntityFrameworkCore;
using WebAppRH.Models;

namespace WebAppRH.Data;

public class AppDbContext : DbContext
{
    public AppDbContext(DbContextOptions<AppDbContext> options) : base(options) { }

    public DbSet<Utilisateur> Utilisateurs { get; set; }
    public DbSet<Administrateur> Administrateurs { get; set; }
    public DbSet<Manager> Managers { get; set; }
    public DbSet<Employe> Employes { get; set; }
    public DbSet<Departement> Departements { get; set; }
    public DbSet<DemandeConge> DemandesConge { get; set; }
    public DbSet<Compte> Comptes { get; set; }

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        // ============================================================
        // 1. HÉRITAGE TPH (Table-Per-Hierarchy) sur Utilisateur
        // ============================================================
        modelBuilder.Entity<Utilisateur>()
            .HasDiscriminator<string>("TypeUtilisateur")
            .HasValue<Administrateur>("Administrateur")
            .HasValue<Manager>("Manager")
            .HasValue<Employe>("Employe");

        // Email unique pour tous les utilisateurs
        modelBuilder.Entity<Utilisateur>()
            .HasIndex(u => u.Email)
            .IsUnique();

        modelBuilder.Entity<Utilisateur>()
            .Property(u => u.Nom)
            .IsRequired()
            .HasMaxLength(100);

        modelBuilder.Entity<Utilisateur>()
            .Property(u => u.Prenom)
            .IsRequired()
            .HasMaxLength(100);

        modelBuilder.Entity<Utilisateur>()
            .Property(u => u.Email)
            .IsRequired()
            .HasMaxLength(150);

        // ============================================================
        // 2. RELATION Utilisateur <-> Compte (1-1)
        // ============================================================
        modelBuilder.Entity<Utilisateur>()
            .HasOne(u => u.Compte)
            .WithOne(c => c.Utilisateur)
            .HasForeignKey<Compte>(c => c.UtilisateurId)
            .OnDelete(DeleteBehavior.Cascade); // Supprimer le compte si l'utilisateur est supprimé

        // Index unique sur le Login du compte
        modelBuilder.Entity<Compte>()
            .HasIndex(c => c.Login)
            .IsUnique();

        // ============================================================
        // 3. RELATION Employe -> Manager (N-1)
        // ============================================================
        modelBuilder.Entity<Employe>()
            .HasOne(e => e.Manager)
            .WithMany(m => m.Equipe)
            .HasForeignKey(e => e.ManagerId)
            .OnDelete(DeleteBehavior.Restrict); // Empêche suppression manager si équipe existante

        // ============================================================
        // 4. RELATION Employe -> Departement (N-1)
        // ============================================================
        modelBuilder.Entity<Employe>()
            .HasOne(e => e.Departement)
            .WithMany(d => d.Employes)
            .HasForeignKey(e => e.DepartementId)
            .OnDelete(DeleteBehavior.Restrict); // Empêche suppression dept si employés rattachés

        // ============================================================
        // 5. RELATION Departement <-> Manager (1-1) — FK côté Departement
        // ============================================================
        modelBuilder.Entity<Departement>()
            .HasOne(d => d.Responsable)
            .WithOne(m => m.Departement)
            .HasForeignKey<Departement>(d => d.ResponsableId)
            .OnDelete(DeleteBehavior.SetNull); // Si manager supprimé, dept reste sans responsable

        modelBuilder.Entity<Departement>()
            .Property(d => d.Nom)
            .IsRequired()
            .HasMaxLength(100);

        // Précision décimale pour les montants financiers
        modelBuilder.Entity<Departement>()
            .Property(d => d.Budget)
            .HasPrecision(18, 2);

        // ============================================================
        // 6. RELATIONS DemandeConge
        // ============================================================
        // DemandeConge -> Employe (N-1) : si l'employé est supprimé, ses demandes le sont aussi
        modelBuilder.Entity<DemandeConge>()
            .HasOne(d => d.Employe)
            .WithMany(e => e.DemandesConge)
            .HasForeignKey(d => d.EmployeId)
            .OnDelete(DeleteBehavior.Cascade);

        // DemandeConge -> Manager (validateur, N-1, optionnelle)
        modelBuilder.Entity<DemandeConge>()
            .HasOne(d => d.ValidePar)
            .WithMany(m => m.DemandesValidees)
            .HasForeignKey(d => d.ValideParId)
            .OnDelete(DeleteBehavior.Restrict);

        // Conversion des enums en string (plus lisible en base de données)
        modelBuilder.Entity<DemandeConge>()
            .Property(d => d.Type)
            .HasConversion<string>()
            .HasMaxLength(20);

        modelBuilder.Entity<DemandeConge>()
            .Property(d => d.Statut)
            .HasConversion<string>()
            .HasMaxLength(20);

        modelBuilder.Entity<DemandeConge>()
            .Property(d => d.MotifRefus)
            .HasMaxLength(500);
    }
}
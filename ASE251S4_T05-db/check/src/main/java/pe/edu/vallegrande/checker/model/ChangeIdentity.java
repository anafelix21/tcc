package pe.edu.vallegrande.checker.model;

public record ChangeIdentity(String id, String author, String file) {
    public String key() { return id + "|" + author + "|" + file.replace('\\', '/'); }
}

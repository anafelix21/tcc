package pe.edu.vallegrande.checker.service;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.core.io.ClassPathResource;
import org.springframework.stereotype.Service;
import pe.edu.vallegrande.checker.model.ChangeIdentity;

import java.io.IOException;
import java.util.List;
import java.util.Map;

@Service
public class ManifestService {
    private final Map<String, List<ChangeIdentity>> engines;

    public ManifestService() throws IOException {
        var mapper = new ObjectMapper();
        var root = mapper.readValue(new ClassPathResource("release-manifest.json").getInputStream(),
                new TypeReference<Map<String, Map<String, List<ChangeIdentity>>>>() {});
        this.engines = root.get("engines");
    }

    public List<ChangeIdentity> expected(String engine) { return engines.getOrDefault(engine, List.of()); }
    public Map<String, List<ChangeIdentity>> all() { return engines; }
}

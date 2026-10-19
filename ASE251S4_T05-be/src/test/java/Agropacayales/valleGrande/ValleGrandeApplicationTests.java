package Agropacayales.valleGrande;

import org.junit.jupiter.api.Test;
import org.springframework.boot.test.context.SpringBootTest;

@SpringBootTest(classes = ValleGrandeApplication.class, properties = "spring.data.mongodb.uri=mongodb://localhost:27017/test")
class ValleGrandeApplicationTests {

    @Test
    void contextLoads() {
    }
}

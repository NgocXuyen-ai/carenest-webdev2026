package com.carenest.backend;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.condition.EnabledIf;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;
import org.testcontainers.DockerClientFactory;

@SpringBootTest
@ActiveProfiles("test")
@EnabledIf("dockerAvailable")
class BackendApplicationTests {

	@Test
	void contextLoads() {
	}

	static boolean dockerAvailable() {
		try {
			return DockerClientFactory.instance().isDockerAvailable();
		} catch (Throwable ignored) {
			return false;
		}
	}

}


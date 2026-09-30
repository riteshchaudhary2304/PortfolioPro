package com.hcl.PortfolioPro;

import static org.junit.jupiter.api.Assertions.assertEquals;

import org.junit.jupiter.api.Test;

class HomeControllerTest {

    @Test
    void homePageShouldReturnWelcomeMessage() {
        HomeController controller = new HomeController();
        assertEquals("PortfolioPro is running", controller.home());
    }
}

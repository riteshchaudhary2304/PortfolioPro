package com.hcl.PortfolioPro;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
public class HomeController {

    @GetMapping("/status")
    public String home() {
        return "PortfolioPro is running";
    }
}

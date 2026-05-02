package com.coldchain.config;

import com.coldchain.entity.Role;
import com.coldchain.security.JwtAuthenticationFilter;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.config.annotation.authentication.builders.AuthenticationManagerBuilder;
import org.springframework.security.config.annotation.method.configuration.EnableGlobalMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.annotation.web.configuration.WebSecurityConfigurerAdapter;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

import java.util.Arrays;

@Configuration
@EnableWebSecurity
@EnableGlobalMethodSecurity(prePostEnabled = true)
public class SecurityConfig extends WebSecurityConfigurerAdapter {

    @Autowired
    private UserDetailsService userDetailsService;

    @Autowired
    private JwtAuthenticationFilter jwtAuthenticationFilter;

    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }

    @Override
    protected void configure(AuthenticationManagerBuilder auth) throws Exception {
        auth.userDetailsService(userDetailsService).passwordEncoder(passwordEncoder());
    }

    @Bean
    @Override
    public AuthenticationManager authenticationManagerBean() throws Exception {
        return super.authenticationManagerBean();
    }

    @Override
    protected void configure(HttpSecurity http) throws Exception {
        http
            .csrf().disable()
            .cors().configurationSource(corsConfigurationSource()).and()
            .sessionManagement().sessionCreationPolicy(SessionCreationPolicy.STATELESS).and()
            .authorizeRequests()
                .antMatchers("/users/login", "/users/register").permitAll()
                .antMatchers("/h2-console/**").permitAll()
                .antMatchers("/swagger-ui/**", "/v3/api-docs/**", "/swagger-resources/**").permitAll()
                .antMatchers("/tasks").hasAnyRole(
                    Role.SHIPPER.toUpperCase(), 
                    Role.CARRIER.toUpperCase(), 
                    Role.DRIVER.toUpperCase(),
                    Role.QUALITY_CONTROL.toUpperCase()
                )
                .antMatchers("/tasks/**/assign").hasRole(Role.CARRIER.toUpperCase())
                .antMatchers("/tasks/**/start", "/tasks/**/complete").hasRole(Role.DRIVER.toUpperCase())
                .antMatchers("/temperature/**").hasAnyRole(
                    Role.SHIPPER.toUpperCase(),
                    Role.CARRIER.toUpperCase(),
                    Role.DRIVER.toUpperCase(),
                    Role.QUALITY_CONTROL.toUpperCase()
                )
                .antMatchers("/alarms/**/handle").hasAnyRole(
                    Role.DRIVER.toUpperCase(),
                    Role.QUALITY_CONTROL.toUpperCase()
                )
                .antMatchers("/alarms/**").hasAnyRole(
                    Role.SHIPPER.toUpperCase(),
                    Role.CARRIER.toUpperCase(),
                    Role.DRIVER.toUpperCase(),
                    Role.QUALITY_CONTROL.toUpperCase()
                )
                .antMatchers("/inspections/**").hasAnyRole(
                    Role.SHIPPER.toUpperCase(),
                    Role.DRIVER.toUpperCase(),
                    Role.QUALITY_CONTROL.toUpperCase()
                )
                .antMatchers("/reports/quality").hasRole(Role.QUALITY_CONTROL.toUpperCase())
                .antMatchers("/reports/**").hasAnyRole(
                    Role.SHIPPER.toUpperCase(),
                    Role.CARRIER.toUpperCase(),
                    Role.QUALITY_CONTROL.toUpperCase()
                )
                .anyRequest().authenticated()
            .and()
            .headers().frameOptions().disable();

        http.addFilterBefore(jwtAuthenticationFilter, UsernamePasswordAuthenticationFilter.class);
    }

    @Bean
    public CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration configuration = new CorsConfiguration();
        configuration.setAllowedOrigins(Arrays.asList(
            "http://localhost:7013",
            "http://127.0.0.1:7013"
        ));
        configuration.setAllowedMethods(Arrays.asList("GET", "POST", "PUT", "DELETE", "OPTIONS"));
        configuration.setAllowedHeaders(Arrays.asList("*"));
        configuration.setAllowCredentials(true);
        
        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", configuration);
        return source;
    }
}

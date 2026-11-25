
package com.kihon.kihon.controller;

import com.kihon.kihon.model.TipoEvento;
import com.kihon.kihon.repository.TipoEventoRepository;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/tipos-evento")
public class TipoEventoController {

    private final TipoEventoRepository tipoEventoRepository;

    public TipoEventoController(
            TipoEventoRepository tipoEventoRepository) {
        this.tipoEventoRepository = tipoEventoRepository;
    }

    @GetMapping
    public ResponseEntity<List<TipoEventoResponse>> listar() {

        List<TipoEventoResponse> respuesta =
                tipoEventoRepository.findAll()
                        .stream()
                        .map(tipo -> new TipoEventoResponse(
                                tipo.getId(),
                                tipo.getNombre()
                        ))
                        .toList();

        return ResponseEntity.ok(respuesta);
    }

    public record TipoEventoResponse(
            Long id,
            String nombre
    ) {}
}
